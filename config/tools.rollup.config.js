import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
export default [
	{
		input: 'tools/scripts/watch.js',
		output: {
			file: 'dist/tools/scripts/watch.js',
			format: 'cjs',
		},
	},
	{
		input: 'tools/scripts/build.js',
		output: {
			file: 'dist/tools/scripts/build.js',
			format: 'cjs',
		},
	},
]
