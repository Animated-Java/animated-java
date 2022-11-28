if (process.argv.includes('--mode=dev')) {
	process.env.NODE_ENV = 'development'
} else {
	process.env.NODE_ENV = 'production'
}

const fs = require('fs')
const esbuild = require('esbuild')
const PACKAGE = require('../package.json')
const sveltePlugin = require('esbuild-plugin-svelte')
const pluginYaml = require('esbuild-plugin-yaml')
const svelteConfig = require('../svelte.config.js')
const yaml = require('js-yaml')
const pathjs = require('path')
let infoPlugin = {
	name: 'infoPlugin',
	/**
	 *
	 * @param {esbuild.PluginBuild} build
	 */
	setup(build) {
		let start = Date.now()
		build.onStart(() => {
			console.log('\u{1F528} Building...')
			start = Date.now()
		})

		build.onEnd(result => {
			let end = Date.now()
			const diff = end - start
			console.log(
				`\u{2705} Build completed in ${diff}ms with ${result.warnings.length} warning${
					result.warnings.length == 1 ? '' : 's'
				} and ${result.errors.length} error${result.errors.length == 1 ? '' : 's'}.`
			)
		})

		build.onLoad(
			{
				filter: /\.[tj]sx?$/,
			},
			result => {
				const code = fs.readFileSync(result.path, 'utf-8')
				return {
					contents: 'const devlog = console.log;\n' + code,
					loader: 'ts',
				}
			}
		)
	},
}

function createBanner(dev) {
	const LICENSE = fs.readFileSync('./LICENSE').toString()
	const snavesutit = PACKAGE.contributors[0]
	let lines = [
		`[ ${PACKAGE.title} ]`,
		`${PACKAGE.description}`,
		`Created by ${PACKAGE.author.name} and, ${snavesutit.name}`,
		`(${PACKAGE.author.email}) [${PACKAGE.author.url}]`,
		`(${snavesutit.email}) [${snavesutit.url}]`,
		``,
		`[ SOURCE ]`,
		`${PACKAGE.repository.url}`,
		``,
		`[ LICENSE ]`,
		...LICENSE.split('\n').map(v => v.trim()),
	]

	let maxLength = JSON.parse(JSON.stringify(lines)).sort((a, b) => b.length - a.length)[0].length
	const leftBuffer = Math.floor(maxLength / 2)
	const rightBuffer = Math.ceil(maxLength / 2)

	let header = `-`.repeat(maxLength + 4)
	let footer = `-`.repeat(maxLength + 4)

	lines = lines.map(v => {
		const div = v.length / 2
		const l = Math.floor(leftBuffer - div)
		const r = Math.ceil(rightBuffer - div)
		return '| ' + ' '.repeat(l) + v + ' '.repeat(r) + ' |'
	})

	let banner = '\n' + [header, ...lines, footer].map(v => `// ${v}`).join('\n') + '\n'

	return {
		js: banner,
	}
}

const defines = {}

Object.entries(process.env).forEach(([key, value]) => {
	if (key.match(/[^A-Za-z0-9_]/i)) return
	defines[`process.env.${key}`] = JSON.stringify(value)
})

function buildDev() {
	esbuild.transformSync('function devlog(message) {console.log(message)}')
	esbuild
		.build({
			entryPoints: ['./src/index.ts'],
			outfile: `./dist/${PACKAGE.name}.js`,
			bundle: true,
			minify: false,
			platform: 'node',
			sourcemap: 'inline',
			plugins: [infoPlugin, pluginYaml.yamlPlugin(), sveltePlugin.default(svelteConfig)],
			watch: true,
			format: 'iife',
			define: defines,
		})
		.catch(() => process.exit(1))
}

function buildProd() {
	esbuild.transformSync('function devlog(message) {}')
	esbuild
		.build({
			entryPoints: ['./src/index.ts'],
			outfile: `./dist/${PACKAGE.name}.js`,
			bundle: true,
			minify: true,
			platform: 'node',
			sourcemap: false,
			plugins: [infoPlugin, pluginYaml.yamlPlugin(), sveltePlugin.default(svelteConfig)],
			banner: createBanner(),
			drop: ['debugger'],
			format: 'iife',
			define: defines,
		})
		.catch(() => process.exit(1))
}

function main() {
	if (process.env.NODE_ENV === 'development') {
		buildDev()
		return
	}
	buildProd()
}

main()
