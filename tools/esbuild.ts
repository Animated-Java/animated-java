if (process.argv.includes('--mode=dev')) {
	process.env.NODE_ENV = 'development'
} else {
	process.env.NODE_ENV = 'production'
}

process.env.FLAVOR ??= `local`

import * as fs from 'fs'
import { readFile } from 'fs-extra'
import { isAbsolute, join } from 'path'
import { TextDecoder } from 'util'
import { load } from 'js-yaml'
import * as esbuild from 'esbuild'
import sveltePlugin from './plugins/sveltePlugin'
import svelteConfig from '../svelte.config.js'
import inlineImage from 'esbuild-plugin-inline-image'
import ImportGlobPlugin from 'esbuild-plugin-import-glob'
import packagerPlugin from './plugins/packagerPlugin'

const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const INFO_PLUGIN: esbuild.Plugin = {
	name: 'infoPlugin',
	setup(build) {
		let start = Date.now()
		build.onStart(() => {
			console.log('\u{1F528} Building...')
			start = Date.now()
		})

		build.onEnd(result => {
			const end = Date.now()
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
	function wrap(s: string, width: number) {
		return s.replace(new RegExp(`(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`, 'g'), '$1\n')
	}

	const LICENSE = fs.readFileSync('./LICENSE').toString()
	const fetchbot = PACKAGE.contributors[0]
	const dominexis = PACKAGE.contributors[1]
	let lines: string[] = [
		String.raw`____ _  _ _ _  _ ____ ___ ____ ___      _ ____ _  _ ____`,
		String.raw`|__| |\ | | |\/| |__|  |  |___ |  \     | |__| |  | |__|`,
		String.raw`|  | | \| | |  | |  |  |  |___ |__/    _| |  |  \/  |  |`,
		``,
		`v${PACKAGE.version as string}`,
		``,
		PACKAGE.description,
		``,
		`Created by ${PACKAGE.author.name as string}`,
		`(${PACKAGE.author.email as string}) [${PACKAGE.author.url as string}]`,
		``,
		`With AMAZING help from`,
		``,
		`${fetchbot.name as string}`,
		`(${fetchbot.email as string}) [${fetchbot.url as string}]`,
		``,
		`and ${dominexis.name as string}`,
		`(${dominexis.email as string}) [${dominexis.url as string}]`,
		``,
		`[ SPECIAL THANKS ]`,
		``,
		`$INSERT_SPECIAL_THANKS_HERE`,
		``,
		`[ SOURCE ]`,
		`${PACKAGE.repository.url as string}`,
		``,
		`[ LICENSE ]`,
		...LICENSE.split('\n').map(v => v.trim()),
	]

	const maxLength = Math.max(...lines.map(line => line.length))

	lines.splice(
		lines.indexOf('$INSERT_SPECIAL_THANKS_HERE'),
		1,
		...wrap(PACKAGE.special_thanks.join(', ') as string, Math.floor(maxLength / 1.5)).split(
			'\n'
		)
	)

	const leftBuffer = Math.floor(maxLength / 2)
	const rightBuffer = Math.ceil(maxLength / 2)

	const header = '╭' + `─`.repeat(maxLength + 2) + '╮'
	const footer = '╰' + `─`.repeat(maxLength + 2) + '╯'

	lines = lines.map(v => {
		const div = v.length / 2
		const l = Math.ceil(leftBuffer - div)
		const r = Math.floor(rightBuffer - div)
		return '│ ' + ' '.repeat(l) + v + ' '.repeat(r) + ' │'
	})

	const banner = '\n' + [header, ...lines, footer].map(v => `//?? ${v}`).join('\n') + '\n'

	return {
		js: banner,
	}
}

const DEFINES: Record<string, string> = {}

Object.entries(process.env).forEach(([key, value]) => {
	if (key.match(/[^A-Za-z0-9_]/i)) return
	DEFINES[`process.env.${key}`] = JSON.stringify(value)
})

const yamlPlugin: (opts: {
	loadOptions?: jsyaml.LoadOptions
	transform?: any
}) => esbuild.Plugin = options => ({
	name: 'yaml',
	setup(build) {
		build.onResolve({ filter: /\.(yml|yaml)$/ }, args => {
			if (args.resolveDir === '') return
			return {
				path: isAbsolute(args.path) ? args.path : join(args.resolveDir, args.path),
				namespace: 'yaml',
			}
		})
		build.onLoad({ filter: /.*/, namespace: 'yaml' }, async args => {
			const yamlContent = await readFile(args.path)
			let parsed = load(new TextDecoder().decode(yamlContent), options?.loadOptions)
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
		outfile: `./dist/${PACKAGE.name as string}.js`,
		bundle: true,
		minify: false,
		platform: 'node',
		sourcemap: 'inline',
		loader: { '.svg': 'dataurl', '.ttf': 'binary', '.mcb': 'text' },
		plugins: [
			inlineImage({
				limit: -1,
			}),
			// @ts-ignore
			ImportGlobPlugin.default(),
			INFO_PLUGIN,
			yamlPlugin({}),
			sveltePlugin(svelteConfig),
			packagerPlugin(),
		],
		format: 'iife',
		define: DEFINES,
	})
	await ctx.watch()
}

function buildProd() {
	// esbuild.transformSync('function devlog(message) {}')
	esbuild
		.build({
			entryPoints: ['./src/index.ts'],
			outfile: `./dist/${PACKAGE.name as string}.js`,
			bundle: true,
			minify: true,
			platform: 'node',
			loader: { '.svg': 'dataurl', '.ttf': 'binary', '.mcb': 'text' },
			plugins: [
				inlineImage({
					limit: -1,
				}),
				// @ts-ignore
				ImportGlobPlugin.default(),
				INFO_PLUGIN,
				yamlPlugin({}),
				sveltePlugin(svelteConfig),
				packagerPlugin(),
			],
			keepNames: true,
			banner: createBanner(),
			drop: ['debugger'],
			format: 'iife',
			define: DEFINES,
		})
		.catch(() => process.exit(1))
}

async function main() {
	if (process.env.NODE_ENV === 'development') {
		await buildDev()
		return
	}
	buildProd()
}

void main()
