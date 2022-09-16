const preprocess = require('svelte-preprocess')
const { typescript } = require('svelte-preprocess-esbuild')
/** @type {import("svelte/types/compiler/interfaces").CompileOptions} */
module.exports.compilerOptions = {
	dev: process.env.NODE_ENV === 'development',
	css: true,
}

module.exports.preprocess = [
	typescript({
		target: 'es2020',
		define: {
			'process.browser': true,
		},
	}),
	preprocess({ typescript: false }),
]
