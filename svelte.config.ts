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
export const transformCssToJs = (css: string) => {
	return `css:{const $deletable = Blockbench.addCSS(${JSON.stringify(
		css
	)});console.log($deletable);}`
}
export default { preprocess, transformCssToJs }
