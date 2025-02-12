import { type Plugin } from 'esbuild'
import * as fs from 'fs'
import { readFileSync, writeFileSync } from 'fs'
import * as pathjs from 'path'
import * as prettier from 'prettier'
import * as c from 'svelte/compiler'
import * as svelteInternal from 'svelte/internal'
import type PackageType from '../../package.json'
import type ChangelogType from '../../src/plugin/package/changelog.json'

const PLUGIN_PACKAGE_PATH = './src/pluginPackage/'
const SVELTE_FILE = './src/pluginPackage/about.svelte'
const README_DIST_PATH = './dist/pluginPackage/about.md'
const DIST_PATH = './dist/'
const DIST_PACKAGE_PATH = './dist/pluginPackage/'
const PLUGIN_REPO_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins/animated_java'
const PLUGIN_MANIFEST_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins.json'
const CHANGELOG_PATH = './src/pluginPackage/changelog.json'
const RELEASE_NOTES_TEMPLATES = './tools/plugins/releaseNoteTemplates/'

function replaceTemplateVars(str: string, items: Record<string, string | undefined>) {
	return str.replace(/\{(.+?)\}/g, str => items[str.replace(/[\{\}]/g, '')] ?? str)
}

type Changelog = typeof ChangelogType

function plugin(): Plugin {
	return {
		name: 'packagerPlugin',
		setup(build) {
			build.onEnd(async () => {
				const packageJSON: typeof PackageType = JSON.parse(
					fs.readFileSync('./package.json', 'utf-8')
				)

				fs.rmSync(DIST_PACKAGE_PATH, { recursive: true, force: true })
				fs.cpSync(PLUGIN_PACKAGE_PATH, DIST_PACKAGE_PATH, { recursive: true })
				fs.copyFileSync(
					`./dist/${packageJSON.name}.js`,
					pathjs.join(DIST_PACKAGE_PATH, packageJSON.name + '.js')
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

				console.log('📦 Packaged')

				if (process.env.NODE_ENV === 'production') {
					console.log('📝 Creating changelogs...')
					const changelog: Changelog = JSON.parse(
						fs.readFileSync(CHANGELOG_PATH, 'utf-8')
					)
					for (const file of fs.readdirSync(RELEASE_NOTES_TEMPLATES)) {
						let content = fs.readFileSync(
							pathjs.join(RELEASE_NOTES_TEMPLATES, file),
							'utf-8'
						)
						const version = packageJSON.version as keyof Changelog
						content = replaceTemplateVars(content, {
							version: packageJSON.version,
							changes: changelog[version].categories
								.find(c => c.title === 'Changes')
								?.list.map(v => '- ' + v)
								.join('\n'),
							fixes: changelog[version].categories
								.find(c => c.title === 'Fixes')
								?.list.map(v => '- ' + v)
								.join('\n'),
						})
						fs.writeFileSync(pathjs.join(DIST_PATH, file), content)
					}

					if (fs.existsSync(PLUGIN_REPO_PATH)) {
						fs.rmSync(PLUGIN_REPO_PATH, { recursive: true, force: true })
						fs.cpSync(DIST_PACKAGE_PATH, PLUGIN_REPO_PATH, { recursive: true })
						const manifest = JSON.parse(fs.readFileSync(PLUGIN_MANIFEST_PATH, 'utf-8'))
						manifest.animated_java.title = packageJSON.title
						manifest.animated_java.author = packageJSON.author.name
						manifest.animated_java.icon = packageJSON.icon
						manifest.animated_java.description = packageJSON.description
						manifest.animated_java.version = packageJSON.version
						manifest.animated_java.min_version = packageJSON.min_blockbench_version
						manifest.animated_java.variant = packageJSON.variant
						manifest.animated_java.tags = packageJSON.tags
						manifest.animated_java.has_changelog = true

						fs.writeFileSync(
							PLUGIN_MANIFEST_PATH,
							await prettier.format(JSON.stringify(manifest), {
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
