import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import React from 'react'
import ReactDOM from 'react-dom'
import ReactIs from 'react-is'
import url from '@rollup/plugin-url'
import yaml from '@rollup/plugin-yaml'
import typescript from 'rollup-plugin-typescript2'
import replace from 'rollup-plugin-replace'
import styles from 'rollup-plugin-styles'
import crypto from 'crypto'

export default {
	input: 'src/animatedJava.ts',
	output: {
		file: 'dist/animated_java.js',
		format: 'cjs',
	},
	plugins: [
		replace({
			'process.env.NODE_ENV': JSON.stringify('developement'),
		}),
		typescript(),
		yaml(),
		styles({
			autoModules: /\.module\.\S+$/,
			mode: [
				'inject',
				(varname, id) => {
					const variable = `deletable_${crypto
						.createHash('sha256')
						.update(id)
						.digest('hex')}`
					return `const clean_${variable} = () => ANIMATED_JAVA.css(${varname});
if (Reflect.has(window, 'ANIMATED_JAVA')) {
	clean_${variable}();
} else {
	// there is absolutly shit we can do about this
	// @ts-ignore
	Blockbench.on('animated-java-ready', clean_${variable});
}`
				},
			],
			dts: true,
		}),
		url({
			include: [
				'**/*.svg',
				'**/*.png',
				'**/*.jpg',
				'**/*.gif',
				'**/*.obj',
				'**/*.wjs',
			],
			limit: Infinity,
		}),
		commonjs({
			include: ['node_modules/**'],
			extensions: ['.ts', '.js'],
			ignoreGlobal: false,
			sourceMap: false,
			namedExports: {
				'react-is': Object.keys(ReactIs),
				react: Object.keys(React),
				'react-dom': Object.keys(ReactDOM),
			},
		}),
		resolve({
			jsnext: true,
			main: true,
		}),
		babel({
			extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx'],
		}),
	],
}
