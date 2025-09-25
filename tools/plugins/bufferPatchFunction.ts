import { type Plugin } from 'esbuild'

export default function plugin(): Plugin {
	return {
		name: 'bufferPatchPlugin',
		setup(build) {
			build.onResolve({ filter: /^buffer$/ }, args => {
				return { path: args.path, namespace: 'buffer-namespace' }
			})

			build.onLoad(
				{ filter: /^buffer$/, namespace: 'buffer-namespace' },
				async ({ path }) => {
					return {
						contents: `export const Buffer = globalThis.Buffer;`,
						loader: 'js',
					}
				}
			)
		},
	}
}
