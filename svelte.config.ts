import { resolve } from 'path'
import prep from 'svelte-preprocess'
import { typescript } from 'svelte-preprocess-esbuild'

export const compilerOptions = {
	dev: process.env.NODE_ENV === 'development',
	css: true,
}

export const preprocess = [
	typescript({
		target: 'es2022',
		define: {
			'process.browser': 'true',
		},
	}),
	prep({ typescript: false }),
]

const IMPORT_PATH = resolve(__dirname, '../src/util/', 'events.ts').replace(/\\/g, '/')

export const transformCssToJs = (css: string) =>
	`import SVELTE_EVENTS from '${IMPORT_PATH}';
	(() => {
		var css;
		SVELTE_EVENTS.PLUGIN_LOAD.subscribe(() => css = Blockbench.addCSS(${JSON.stringify(css)}));
		SVELTE_EVENTS.PLUGIN_UNLOAD.subscribe(() => css?.delete());
	})()`.replace(/[\t\n]/g, '')

export default { preprocess, transformCssToJs }
