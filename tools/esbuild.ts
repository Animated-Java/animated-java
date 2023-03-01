if (process.argv.includes('--mode=dev')) {
	process.env.NODE_ENV = 'development'
} else {
	process.env.NODE_ENV = 'production'
}

import * as fs from 'fs'
import fsExtra from 'fs-extra'
import pathjs from 'path'
import util from 'util'
import jsyaml from 'js-yaml'
import * as esbuild from 'esbuild'
import sveltePlugin from './plugins/sveltePlugin'
import svelteConfig from '../svelte.config.js'
import * as workerPlugin from './plugins/workerPlugin'

console.log(sveltePlugin)

const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

let infoPlugin: esbuild.Plugin = {
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
	},
}

function createBanner() {
	const LICENSE = fs.readFileSync('./LICENSE').toString()
	const fetchbot = PACKAGE.contributors[0]
	const dominexis = PACKAGE.contributors[1]
	const otherContributors = PACKAGE.contributors.slice(2)
	let lines = [
		String.raw`____ _  _ _ _  _ ____ ___ ____ ___      _ ____ _  _ ____`,
		String.raw`|__| |\ | | |\/| |__|  |  |___ |  \     | |__| |  | |__|`,
		String.raw`|  | | \| | |  | |  |  |  |___ |__/    _| |  |  \/  |  |`,
		``,
		`v${PACKAGE.version}`,
		``,
		PACKAGE.description,
		``,
		`Created by ${PACKAGE.author.name}`,
		`(${PACKAGE.author.email}) [${PACKAGE.author.url}]`,
		``,
		`With AMAZING help from`,
		``,
		`${fetchbot.name}`,
		`(${fetchbot.email}) [${fetchbot.url}]`,
		``,
		`and ${dominexis.name}`,
		`(${dominexis.email}) [${dominexis.url}]`,
		otherContributors.length
			? `And contributions from ${otherContributors.map((v: any) => `${v.name}`).join(', ')}`
			: '',
		`[ SOURCE ]`,
		`${PACKAGE.repository.url}`,
		``,
		`[ LICENSE ]`,
		...LICENSE.split('\n').map(v => v.trim()),
	]

	let maxLength = Math.max(...lines.map(line => line.length))
	const leftBuffer = Math.floor(maxLength / 2)
	const rightBuffer = Math.ceil(maxLength / 2)

	let header = '╭' + `─`.repeat(maxLength + 2) + '╮'
	let footer = '╰' + `─`.repeat(maxLength + 2) + '╯'

	lines = lines.map(v => {
		const div = v.length / 2
		const l = Math.ceil(leftBuffer - div)
		const r = Math.floor(rightBuffer - div)
		return '│ ' + ' '.repeat(l) + v + ' '.repeat(r) + ' │'
	})

	let banner = '\n' + [header, ...lines, footer].map(v => `//?? ${v}`).join('\n') + '\n'

	return {
		js: banner,
	}
}

const defines: Record<string, string> = {}

Object.entries(process.env).forEach(([key, value]) => {
	if (key.match(/[^A-Za-z0-9_]/i)) return
	defines[`process.env.${key}`] = JSON.stringify(value)
})

async function buildWorker(path: string) {
	console.log('🤖\u{1F528} Building Worker...')
	const start = Date.now()
	const result = await esbuild.build({
		entryPoints: [path],
		bundle: true,
		minify: process.env.NODE_ENV == 'production',
		sourcemap: process.env.NODE_ENV == 'development' ? 'inline' : false,
		write: false,
		target: 'es2019',
		platform: 'browser',
		format: 'iife',
		drop: process.env.NODE_ENV == 'production' ? ['debugger'] : [],
		metafile: true,
	})
	const end = Date.now()
	const diff = end - start
	console.log(
		`🤖\u{2705} Build completed in ${diff}ms with ${result.warnings.length} warning${
			result.warnings.length == 1 ? '' : 's'
		} and ${result.errors.length} error${result.errors.length == 1 ? '' : 's'}.`
	)
	return result
}

const yamlPlugin: (opts: { loadOptions?: any; transform?: any }) => esbuild.Plugin = options => ({
	name: 'yaml',
	setup(build) {
		build.onResolve({ filter: /\.(yml|yaml)$/ }, args => {
			if (args.resolveDir === '') return
			return {
				path: pathjs.isAbsolute(args.path)
					? args.path
					: pathjs.join(args.resolveDir, args.path),
				namespace: 'yaml',
			}
		})
		build.onLoad({ filter: /.*/, namespace: 'yaml' }, async args => {
			const yamlContent = await fsExtra.readFile(args.path)
			let parsed = jsyaml.load(
				new util.TextDecoder().decode(yamlContent),
				options?.loadOptions
			)
			if (options?.transform && options.transform(parsed, args.path) !== void 0)
				parsed = options.transform(parsed, args.path)
			return {
				contents: JSON.stringify(parsed),
				loader: 'json',
				watchFiles: [args.path],
			}
		})
	},
})

async function buildDev() {
	const ctx = await esbuild.context({
		banner: createBanner(),
		entryPoints: ['./src/index.ts'],
		outfile: `./dist/${PACKAGE.name}.js`,
		bundle: true,
		minify: false,
		platform: 'node',
		sourcemap: 'inline',
		loader: { '.svg': 'dataurl' },
		plugins: [
			workerPlugin.workerPlugin({
				builder: buildWorker,
				typeDefPath: './src/globalWorker.d.ts',
			}),
			infoPlugin,
			yamlPlugin({}),
			sveltePlugin(svelteConfig as any),
		],
		format: 'iife',
		define: defines,
	})
	ctx.watch()
}

function buildProd() {
	// esbuild.transformSync('function devlog(message) {}')
	esbuild
		.build({
			entryPoints: ['./src/index.ts'],
			outfile: `./dist/${PACKAGE.name}.js`,
			bundle: true,
			minify: true,
			platform: 'node',
			sourcemap: false,
			loader: { '.svg': 'dataurl' },
			plugins: [
				workerPlugin.workerPlugin({
					builder: buildWorker,
				}),
				infoPlugin,
				yamlPlugin({}),
				sveltePlugin(svelteConfig as any),
			],
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
