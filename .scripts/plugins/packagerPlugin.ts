import type { Plugin } from 'esbuild'
import * as fs from 'fs'
import { readFileSync, writeFileSync } from 'fs'
import { Octokit } from 'octokit'
import { basename, join } from 'path'
import * as prettier from 'prettier'
import { sveltePreprocess } from 'svelte-preprocess'
// @ts-expect-error - Types are broken in nodenext for this package, but it works fine.
import { typescript } from 'svelte-preprocess-esbuild'
import type { CompileOptions, CompileResult } from 'svelte/compiler'
import { compile, preprocess } from 'svelte/compiler'
import { render } from 'svelte/server'
// @ts-expect-error - Svelte's internal server-side rendering API is not typed, but we need it to render the about.svelte file at build time.
import * as svelteInternalServer from 'svelte/internal/server'

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

/**
 * Convert a warning or error emitted from the svelte compiler for esbuild.
 */
function convertWarning(source: any, { message, filename, start, end }: any) {
	if (!start || !end) {
		return { text: message }
	}
	const lines = source.split(/\r\n|\r|\n/)
	const lineText = lines[start.line - 1]
	const location = {
		file: filename,
		line: start.line,
		column: start.column,
		length: (start.line === end.line ? end.column : lineText.length) - start.column,
		lineText,
	}
	return { text: message, location }
}

async function renderSvelteFileToStaticHTML(path: string) {
	const filename = basename(path)
	const source = readFileSync(path, 'utf-8')
	const processed = await preprocess(
		source,
		[
			typescript({
				target: 'es2022',
				define: {
					'process.browser': 'true',
				},
			}),
			sveltePreprocess({
				typescript: false,
				sourceMap: process.env.NODE_ENV === 'development',
			}),
		],
		{ filename }
	)
	const compilerOptions: CompileOptions = {
		filename,
		sourcemap: processed.map,
		css: 'external',
		// @ts-expect-error - Svelte multiselect is breaking svelte types...
		generate: 'server',
		cssHash() {
			return `animated-java-plugin-about-page`
		},
	}
	let res: CompileResult
	try {
		res = compile(processed.code, compilerOptions)
	} catch (err: any) {
		return { errors: [convertWarning(processed.code, err)] }
	}
	const component = new Function(
		'svelteInternalServer',
		res.js.code
			.replace('export default ', 'return ')
			.replace(
				`import * as $ from 'svelte/internal/server';`,
				'const $ = svelteInternalServer;'
			)
	)(svelteInternalServer)

	let contents = render(component, {}).body
	// Remove all comments
	contents = contents.replaceAll(/<!--.*?-->/gs, '')
	// Emit CSS, otherwise it will be included in the JS and injected at runtime.
	if (res.css?.code) {
		contents = `${contents}\n<style>${res.css.code}</style>`
	}

	return {
		contents,
		warnings: res.warnings.map(warning => convertWarning(source, warning)),
	}
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
					join(DIST_PACKAGE_PATH, PACKAGE.name + '.js')
				)
				const svelteResult = await renderSvelteFileToStaticHTML(SVELTE_FILE)

				if (
					svelteResult.contents == undefined ||
					svelteResult.warnings.length > 0 ||
					svelteResult.errors != undefined
				) {
					return {
						errors: svelteResult.errors,
						warnings: svelteResult.warnings,
					}
				}

				const html = svelteResult.contents
				writeFileSync(README_DIST_PATH, html)
				if (fs.existsSync(join(DIST_PACKAGE_PATH, 'about.svelte')))
					fs.unlinkSync(join(DIST_PACKAGE_PATH, 'about.svelte'))

				if (process.env.NODE_ENV === 'production') {
					try {
						console.log('📝 Creating changelogs...')
						const rawChangelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8')
						const changelog = JSON.parse(rawChangelog)
						for (const file of fs.readdirSync(RELEASE_NOTES_TEMPLATES)) {
							let content = fs.readFileSync(
								join(RELEASE_NOTES_TEMPLATES, file),
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

							let categories = ''
							for (const category of versionChangelog.categories) {
								categories +=
									`\n\n### ${category.title}\n\n` +
									category.list
										.map((v: string) => '- ' + v)
										.join('\n')
										.replaceAll('[BREAKING]', '⚠️ **BREAKING** —')
							}

							content = replaceTemplateVars(content, {
								version: PACKAGE.version,
								categories: categories.trim(),
								pings: pings.trim(),
							})

							if (content.includes('[[ESCAPE_URLS]]')) {
								content = content
									.replace('[[ESCAPE_URLS]]', '')
									.replaceAll(URL_REGEX, (match: string) => '<' + match + '>')
							}

							fs.writeFileSync(join(DIST_PATH, file), content)
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
							await prettier.format(JSON.stringify(manifest, null, '\t'), {
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
