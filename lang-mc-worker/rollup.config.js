import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
export default {
	input: './lang-mc-worker/web_worker.js',
	output: {
		file: './src/dependencies/lang-mc-worker/lang-mc.worker.wjs',
		format: 'es',
		compact: true,
	},
	plugins: [
		resolve({
			jsnext: true,
		}),
		commonjs({
			include: ['node_modules/**'],
			ignoreGlobal: false,
			sourceMap: false,
		}),
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		babel({
			extensions: ['.js', '.ts', '.tsx'],
		}),
		terser(),
	],
}
