import { type Plugin } from 'esbuild'
import * as fs from 'fs'
import { readFileSync, writeFileSync } from 'fs'
import * as pathjs from 'path'
import * as prettier from 'prettier'
import { compile } from 'svelte/compiler'
// @ts-expect-error
import * as svelteServer from 'svelte/internal/server'
import type PackageType from '../../package.json'
import type ChangelogType from '../../src/plugin-package/changelog.json'

const SRC = './src/'
const SRC_PACKAGE = pathjs.join(SRC, 'plugin-package/')
const SRC_ABOUT = pathjs.join(SRC_PACKAGE, 'about.svelte')
const SRC_CHANGELOG = pathjs.join(SRC_PACKAGE, 'changelog.json')

const DIST = './dist/'
const DIST_PACKAGE = pathjs.join(DIST, 'package/')
const DIST_README = pathjs.join(DIST_PACKAGE, 'about.md')

const PLUGIN_REPO_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins/animated_java'
const PLUGIN_MANIFEST_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins.json'
const RELEASE_NOTES_TEMPLATES = './tools/esbuild-plugins/release-note-templates/'

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
				fs.rmSync(DIST_PACKAGE, { recursive: true, force: true })
				fs.cpSync(SRC_PACKAGE, DIST_PACKAGE, { recursive: true })
				const pluginBuildPath = `./dist/${packageJSON.name}.js`
				if (!fs.existsSync(pluginBuildPath)) {
					console.error('❌ Plugin build not found while packaging!')
					return
				}
				fs.copyFileSync(
					pluginBuildPath,
					pathjs.join(DIST_PACKAGE, packageJSON.name + '.js')
				)
				const svelteResult = compile(readFileSync(SRC_ABOUT, 'utf-8'), {
					generate: 'server',
					cssHash({ hash, css }) {
						return `animated-java-plugin-page-${hash(css)}`
					},
				})
				const component = new Function(
					'svelteServer',
					svelteResult.js.code
						.replace(
							"import * as $ from 'svelte/internal/server';",
							'const $ = svelteServer;'
						)
						.replace('export default', 'return')
				)(svelteServer)
				const result = svelteServer.render(component)
				const html = `${result.html.replace(/^\t+/gm, '')}\n<style>${svelteResult.css!.code}</style>`
				writeFileSync(DIST_README, html)
				if (fs.existsSync(pathjs.join(DIST_PACKAGE, 'about.svelte')))
					fs.unlinkSync(pathjs.join(DIST_PACKAGE, 'about.svelte'))

				console.log('📦 Packaged')

				if (process.env.NODE_ENV === 'production') {
					console.log('📝 Creating changelogs...')
					const changelog: Changelog = JSON.parse(fs.readFileSync(SRC_CHANGELOG, 'utf-8'))
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
						fs.writeFileSync(pathjs.join(DIST, file), content)
					}

					if (fs.existsSync(PLUGIN_REPO_PATH)) {
						fs.rmSync(PLUGIN_REPO_PATH, { recursive: true, force: true })
						fs.cpSync(DIST_PACKAGE, PLUGIN_REPO_PATH, { recursive: true })
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
