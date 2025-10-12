import type { Plugin } from 'esbuild'
import * as fs from 'fs'
import { readFileSync, writeFileSync } from 'fs'
import { Octokit } from 'octokit'
import * as pathjs from 'path'
// @ts-expect-error No types
import * as prettier from 'prettier'
import * as c from 'svelte/compiler'
import * as svelteInternal from 'svelte/internal'

const OCTO_KIT = new Octokit({})

const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const PLUGIN_PACKAGE_PATH = './src/pluginPackage/'
const SVELTE_FILE = './src/pluginPackage/about.svelte'
const README_DIST_PATH = './dist/pluginPackage/about.md'
const DIST_PATH = './dist/'
const DIST_PACKAGE_PATH = './dist/pluginPackage/'
const PLUGIN_REPO_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins/animated_java'
const PLUGIN_MANIFEST_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins.json'
const CHANGELOG_PATH = './src/pluginPackage/changelog.json'
const RELEASE_NOTES_TEMPLATES = './tools/plugins/releaseNoteTemplates/'
const URL_REGEX =
	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm

function replaceTemplateVars(str: string, items: Record<string, string>) {
	return str.replace(/\{(.+?)\}/g, str => items[str.replace(/[\{\}]/g, '')] ?? str)
}

const VERSION_REGEX = /(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+))?/

function getVersionNumbers(version: string) {
	const match = VERSION_REGEX.exec(version)
	if (!match) return null
	const major = parseInt(match[1])
	const minor = parseInt(match[2])
	const patch = parseInt(match[3])
	const preRelease = match[4] ?? null
	return { major, minor, patch, preRelease }
}

function plugin(): Plugin {
	return {
		name: 'packagerPlugin',
		setup(build) {
			build.onEnd(async () => {
				console.log('📦 Packaging...')
				fs.rmSync(DIST_PACKAGE_PATH, { recursive: true, force: true })
				fs.cpSync(PLUGIN_PACKAGE_PATH, DIST_PACKAGE_PATH, { recursive: true })
				fs.copyFileSync(
					`./dist/${PACKAGE.name}.js`,
					pathjs.join(DIST_PACKAGE_PATH, PACKAGE.name + '.js')
				)
				const svelteResult = c.compile(readFileSync(SVELTE_FILE, 'utf-8'), {
					generate: 'ssr',
					cssHash({ hash, css }) {
						return `animated-java-plugin-page-${hash(css)}`
					},
				})
				const component = new Function(
					'svelteInternal',
					svelteResult.js.code
						.replace(/from "svelte\/internal"/g, ' = svelteInternal')
						.replace('export default', 'return')
						.replace('import', 'const')
				)
				const result = component(svelteInternal).render()
				const html = `${result.html}\n<style>${result.css.code}</style>`
				writeFileSync(README_DIST_PATH, html)
				if (fs.existsSync(pathjs.join(DIST_PACKAGE_PATH, 'about.svelte')))
					fs.unlinkSync(pathjs.join(DIST_PACKAGE_PATH, 'about.svelte'))

				if (process.env.NODE_ENV === 'production') {
					try {
						console.log('📝 Creating changelogs...')
						const rawChangelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8')
						const changelog = JSON.parse(rawChangelog)
						for (const file of fs.readdirSync(RELEASE_NOTES_TEMPLATES)) {
							let content = fs.readFileSync(
								pathjs.join(RELEASE_NOTES_TEMPLATES, file),
								'utf-8'
							)
							let pings = ''
							const version = getVersionNumbers(PACKAGE.version)
							if (!version) {
								throw new Error(
									`Version ${PACKAGE.version} in package.json is not valid semver!`
								)
							}
							const latestRelease = getVersionNumbers(
								(
									await OCTO_KIT.request('GET /repos/{owner}/{repo}/releases', {
										owner: 'animated-java',
										repo: 'animated-java',
										per_page: 1,
										headers: {
											accept: 'application/vnd.github+json',
											'X-GitHub-Api-Version': '2022-11-28',
										},
									})
								).data[0].tag_name
							)
							if (!latestRelease) {
								throw new Error('No latest release found on github!')
							}
							if (version.major > latestRelease.major) {
								pings += `@Major Release Ping`
							}
							if (version.minor > latestRelease.minor) {
								pings += ` @Minor Release Ping`
							}
							if (version.patch > latestRelease.patch) {
								pings += ` @Patch Release Ping`
							}
							if (latestRelease.preRelease) {
								pings += ` @Pre-Release Ping`
							}
							if (rawChangelog.includes('[BREAKING]')) {
								pings += ` @Breaking Changes Ping`
							}

							const versionChangelog = changelog[PACKAGE.version]
							if (!versionChangelog) {
								throw new Error(
									`No changelog found for version ${PACKAGE.version} in ${CHANGELOG_PATH}`
								)
							}

							const changeList = versionChangelog.categories.find(
								(c: any) => c.title === 'Changes'
							)
							let changes = ''
							if (changeList) {
								changes =
									'### Changes\n\n' +
									changeList.list
										.map((v: any) => '- ' + v)
										.join('\n')
										.replace('[BREAKING]', '⚠️ **BREAKING CHANGE** — ')
							}
							const fixList = versionChangelog.categories.find(
								(c: any) => c.title === 'Fixes'
							)
							let fixes = ''
							if (fixList) {
								fixes =
									'### Fixes\n\n' +
									fixList.list
										.map((v: any) => '- ' + v)
										.join('\n')
										.replace('[BREAKING]', '⚠️ **BREAKING CHANGE** — ')
							}

							content = replaceTemplateVars(content, {
								version: PACKAGE.version,
								changes,
								fixes,
								pings: pings.trim(),
							})

							if (content.includes('[[ESCAPE_URLS]]')) {
								content = content
									.replace('[[ESCAPE_URLS]]', '')
									.replaceAll(URL_REGEX, (match: string) => '<' + match + '>')
							}

							fs.writeFileSync(pathjs.join(DIST_PATH, file), content)
						}
					} catch (e) {
						console.error('Error creating changelogs:', e)
						throw e
					}

					if (fs.existsSync(PLUGIN_REPO_PATH)) {
						fs.rmSync(PLUGIN_REPO_PATH, { recursive: true, force: true })
						fs.cpSync(DIST_PACKAGE_PATH, PLUGIN_REPO_PATH, { recursive: true })
						const manifest = JSON.parse(fs.readFileSync(PLUGIN_MANIFEST_PATH, 'utf-8'))
						manifest.animated_java.title = PACKAGE.title
						manifest.animated_java.author = PACKAGE.author.name
						manifest.animated_java.icon = PACKAGE.icon
						manifest.animated_java.description = PACKAGE.description
						manifest.animated_java.version = PACKAGE.version
						manifest.animated_java.min_version = PACKAGE.min_blockbench_version
						manifest.animated_java.max_version = PACKAGE.max_blockbench_version
						manifest.animated_java.variant = PACKAGE.variant
						manifest.animated_java.tags = PACKAGE.tags
						manifest.animated_java.has_changelog = true

						fs.writeFileSync(
							PLUGIN_MANIFEST_PATH,
							prettier.format(JSON.stringify(manifest, null, '\t'), {
								useTabs: true,
								parser: 'json',
							})
						)
						console.log('📋 Copied to Plugin Repo!')
					}
				}
			})
		},
	}
}

export default plugin
