// A MODIFIED VERSION OF THE SVELTE PLUGIN FOR ESBUILD (esbuild-plugin-svelte)

// CHANGELOG:
// made it so that css can be emmitted directly as js instead of as an import

'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
import type { Plugin, TransformOptions } from 'esbuild'
import { readFile } from 'fs/promises'
import { relative } from 'path'
import type { PreprocessorGroup } from 'svelte-preprocess/dist/types'
import type { CompileResult, ModuleCompileOptions } from 'svelte/compiler'
import { type CompileOptions, compile, preprocess } from 'svelte/compiler'
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

type Warning = CompileResult['warnings'][number]
export interface ISvelteESBuildPluginOptions {
	/**
	 * Svelte compiler options
	 */
	compilerOptions?: CompileOptions
	/**
	 * Svelte compiler options for module files (*.svelte.js and *.svelte.ts)
	 */
	moduleCompilerOptions?: ModuleCompileOptions
	/**
	 * A function that transforms CSS into JS.
	 */
	transformCssToJs: (css: string) => string
	/**
	 * esbuild transform options for ts module files (.svelte.ts)
	 */
	esbuildTsTransformOptions?: TransformOptions
	/**
	 * The preprocessor(s) to run the Svelte code through before compiling
	 */
	preprocess?: PreprocessorGroup | PreprocessorGroup[]
	/**
	 * Attempts to cache compiled files if the mtime of the file hasn't changed since last run.
	 *
	 */
	cache?: boolean
	/**
	 * The regex filter to use when filtering files to compile
	 * Defaults to `/\.svelte$/`
	 */
	include?: RegExp
	/**
	 * A function to filter out warnings
	 * Defaults to a constant function that returns `true`
	 */
	filterWarnings?: (warning: Warning) => boolean
}

function esbuildPluginSvelte(opts: ISvelteESBuildPluginOptions): Plugin {
	return {
		name: 'esbuild-plugin-svelte',
		setup(build) {
			/** A cache of the compiled CSS. */
			const cache = new Map()
			// Register loader for the 'fake' CSS files that we import from
			// the compiled Javascript.
			build.onLoad({ filter: /\.svelte\.css$/ }, ({ path }) => {
				const contents = cache.get(path)
				return contents ? { contents, loader: 'css' } : null
			})
			// Register loader for all .svelte files.
			//
			build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
				let source = await readFile(path, 'utf-8')
				let sourcemap: any
				const filename = relative(process.cwd(), path)
				if (opts.preprocess) {
					const processed = await preprocess(source, opts.preprocess, { filename })
					source = processed.code
					sourcemap = processed.map
				}
				const compilerOptions: CompileOptions = {
					...opts.compilerOptions,
					filename,
					sourcemap,
					css: 'external',
					generate: 'client',
				}
				let res: CompileResult
				try {
					res = compile(source, compilerOptions)
				} catch (err: any) {
					return { errors: [convertWarning(source, err)] }
				}
				const { js, css, warnings } = res
				let contents = `${js.code}\n//# sourceMappingURL=${js.map.toUrl()}`
				// Emit CSS, otherwise it will be included in the JS and injected at runtime.
				if (css?.code && opts.transformCssToJs) {
					contents = `${contents}\n${opts.transformCssToJs(css.code)}`
				} else if (css?.code && !compilerOptions.css) {
					const cssPath = `${path}.css`
					cache.set(cssPath, `${css.code}/*# sourceMappingURL=${css.map.toUrl()}*/`)
					contents = `${contents}\nimport ${JSON.stringify(cssPath)}`
				}

				return {
					contents,
					warnings: warnings.map(w => convertWarning(source, w)),
				}
			})
		},
	}
}
export default esbuildPluginSvelte
