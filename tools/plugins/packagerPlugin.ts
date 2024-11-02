import { Plugin } from 'esbuild'
import * as fs from 'fs'
import * as pathjs from 'path'
import * as c from 'svelte/compiler'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import * as svelteInternal from 'svelte/internal'
import * as prettier from 'prettier'

const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const PLUGIN_PACKAGE_PATH = './src/pluginPackage/'
const SVELTE_FILE = './src/pluginPackage/about.svelte'
const README_DIST_PATH = './dist/pluginPackage/about.md'
const DIST_PATH = './dist/pluginPackage/'
const PLUGIN_REPO_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins/animated_java'
const PLUGIN_MANIFEST_PATH = 'D:/github-repos/snavesutit/blockbench-plugins/plugins.json'

function plugin(): Plugin {
	return {
		name: 'packagerPlugin',
		setup(build) {
			build.onEnd(() => {
				fs.rmSync(DIST_PATH, { recursive: true, force: true })
				fs.cpSync(PLUGIN_PACKAGE_PATH, DIST_PATH, { recursive: true })
				fs.copyFileSync(
					`./dist/${PACKAGE.name}.js`,
					pathjs.join(DIST_PATH, PACKAGE.name + '.js')
				)
				const svelteResult = c.compile(readFileSync(SVELTE_FILE, 'utf-8'), {
					generate: 'ssr',
					cssHash({ name, filename, hash, css }) {
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
				if (fs.existsSync(pathjs.join(DIST_PATH, 'about.svelte')))
					fs.unlinkSync(pathjs.join(DIST_PATH, 'about.svelte'))

				if (process.env.NODE_ENV === 'production' && fs.existsSync(PLUGIN_REPO_PATH)) {
					fs.rmSync(PLUGIN_REPO_PATH, { recursive: true, force: true })
					fs.cpSync(DIST_PATH, PLUGIN_REPO_PATH, { recursive: true })
					const manifest = JSON.parse(fs.readFileSync(PLUGIN_MANIFEST_PATH, 'utf-8'))
					manifest.animated_java.title = PACKAGE.title
					manifest.animated_java.author = PACKAGE.author.name
					manifest.animated_java.icon = PACKAGE.icon
					manifest.animated_java.description = PACKAGE.description
					manifest.animated_java.version = PACKAGE.version
					manifest.animated_java.min_version = PACKAGE.min_blockbench_version
					manifest.animated_java.variant = PACKAGE.variant
					manifest.animated_java.tags = PACKAGE.tags

					fs.writeFileSync(
						PLUGIN_MANIFEST_PATH,
						prettier.format(JSON.stringify(manifest, null, '\t'), {
							useTabs: true,
							parser: 'json',
						})
					)
					console.log('📋 Copied to Plugin Repo!')
				}
			})
		},
	}
}

export default plugin
