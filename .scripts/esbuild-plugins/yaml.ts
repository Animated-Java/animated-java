import ESBuild from 'esbuild'
import { readFile } from 'fs/promises'
import { load } from 'js-yaml'
import { isAbsolute, join } from 'path'

const yamlPlugin: (opts: {
	loadOptions?: jsyaml.LoadOptions
	transform?: (data: any, filePath: string) => any
}) => ESBuild.Plugin = options => ({
	name: 'yaml',
	setup(build) {
		build.onResolve({ filter: /\.(yml|yaml)$/ }, args => {
			if (args.resolveDir === '') return
			return {
				path: isAbsolute(args.path) ? args.path : join(args.resolveDir, args.path),
				namespace: 'yaml',
			}
		})
		build.onLoad({ filter: /.*/, namespace: 'yaml' }, async args => {
			const yamlContent = await readFile(args.path)
			let parsed = load(new TextDecoder().decode(yamlContent), options?.loadOptions)
			if (options?.transform && options.transform(parsed, args.path) !== void 0)
				parsed = options.transform(parsed, args.path)
			return {
				contents: JSON.stringify(parsed),
				loader: 'json',
				watchFiles: [args.path],
			}
		})
	},
})

export default yamlPlugin
