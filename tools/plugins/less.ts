import * as esbuild from 'esbuild'
import { mkdirSync, writeFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import * as lessCss from 'less'
import { parse, relative, resolve } from 'path'
import postcss from 'postcss'
import * as modules from 'postcss-modules'
import * as crypto from 'crypto'
import * as cssnano from 'cssnano'
export interface LessPluginOptions {
	writeTypes?: boolean
	outputBase: string
	relativePath: string
	generateScopeName?: string
	inline?: boolean
	extra?: string
}

export const less: (a: LessPluginOptions) => esbuild.Plugin = ({
	writeTypes,
	outputBase,
	relativePath,
	generateScopeName,
	inline,
	extra,
}: LessPluginOptions) => ({
	name: 'Less',
	setup(build: esbuild.PluginBuild) {
		build.onLoad(
			{
				filter: /\.less$/,
			},
			async ctx => {
				const results = await lessCss.render(await readFile(ctx.path, 'utf8'), {
					filename: ctx.path,
					sourceMap: {},
				})
				let _json
				const result = await postcss([
					modules({
						generateScopedName: generateScopeName || '[name]_[local]_[hash:base64:16]',
						getJSON: (cssFileName, json) => {
							_json = json
							if (writeTypes) {
								const dTs = `export const styles:{${Object.keys(json)
									.map(_ => `"${_}":string;`)
									.join('')}};export const cssPath:string;`
								writeFile(ctx.path + '.d.ts', dTs)
							}
						},
					}),
					cssnano({
						preset: 'default',
					}),
				])
					.process(results.css, { from: ctx.path })
					.async()
				const resultPath = resolve(
					outputBase,
					parse(ctx.path).name.replace('.module', '') +
						'.' +
						crypto.createHash('md5').update(result.css).digest('hex') +
						'.css'
				)
				if (!inline) {
					mkdirSync(parse(resultPath).dir, { recursive: true })
					writeFileSync(resultPath, result.css)
				}
				return {
					contents:
						`export const styles = ${JSON.stringify(
							_json
						)};\nexport const cssPath = ${JSON.stringify(
							inline
								? result.css
								: relative(relativePath, resultPath).replace(/\\/g, '/')
						)};\n` + (extra ? extra : ''),
					watchFiles: [ctx.path],
				}
			}
		)
	},
})
