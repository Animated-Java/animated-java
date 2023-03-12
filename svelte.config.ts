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

const IMPORT_PATH = resolve(__dirname, '../src/', 'events.ts')

export const transformCssToJs = (css: string) => {
	return `import * as SVELTEEVENTS from ${JSON.stringify(IMPORT_PATH)};
	const $deletable = Blockbench.addCSS(${JSON.stringify(css)});
	SVELTEEVENTS.UNLOAD.subscribe(() => $deletable(), true);
	SVELTEEVENTS.UNINSTALL.subscribe(() => $deletable(), true);`
}
export default { preprocess, transformCssToJs }
