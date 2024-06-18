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

const IMPORT_PATH = resolve(__dirname, '../src/util/', 'events.ts')

export const transformCssToJs = (
	css: string
) => `import { events as SVELTE_EVENTS } from ${JSON.stringify(IMPORT_PATH)};
(() => {
	const $deletable = Blockbench.addCSS(${JSON.stringify(css)});
	function DELETE_SVELTE_CSS() { $deletable?.delete() }
	SVELTE_EVENTS.UNLOAD.subscribe(DELETE_SVELTE_CSS, true);
	SVELTE_EVENTS.UNINSTALL.subscribe(DELETE_SVELTE_CSS, true);
})()`

export default { preprocess, transformCssToJs }
