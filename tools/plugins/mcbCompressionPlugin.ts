import type { Plugin } from 'esbuild'
import * as fflate from 'fflate'
import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import * as pathjs from 'path'

function zip(data: fflate.AsyncZippable): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		fflate.zip(data, { level: 9 }, (err, data) => {
			if (err) reject(err)
			else resolve(data)
		})
	})
}

export default function plugin(): Plugin {
	return {
		name: 'mcbCompressionPlugin',
		setup(build) {
			const mcbFiles = new Map<string, fflate.AsyncZippableFile>()

			build.onResolve({ filter: /\.mcbt?$/ }, args => {
				const path = pathjs.join(args.resolveDir, args.path)

				if (!existsSync(path)) {
					return { errors: [{ text: `MCB file not found: ${path}` }] }
				}

				return {
					path,
					namespace: 'mcb',
					watchFiles: [path],
				}
			})

			build.onLoad({ filter: /\.mcbt?$/, namespace: 'mcb' }, async ({ path }) => {
				const localPath = pathjs.relative(process.cwd(), path).replace(/\\/g, '/')
				const data = await fs.readFile(path)
				mcbFiles.set(localPath, new Uint8Array(data))

				return {
					contents: `
import getZipFile from '__MCB_ZIP_DATA'
export default getZipFile('${localPath}')
`,
					loader: 'js',
				}
			})

			build.onResolve({ filter: /^__MCB_ZIP_DATA$/ }, ({ path }) => {
				return {
					path,
					namespace: 'mcbZipData',
				}
			})

			build.onLoad({ filter: /.*/, namespace: 'mcbZipData' }, async () => {
				const zipped = await zip(Object.fromEntries(mcbFiles.entries()))
				const data = Buffer.from(zipped).toString('base64')
				return {
					contents: `
import * as fflate from 'fflate'
const unzipped = fflate.unzipSync(Uint8Array.from(atob('${data}'), c => c.charCodeAt(0)))
export default function getFile(path) {
	return Buffer.from(unzipped[path]).toString('utf-8')
}
`,
					resolveDir: process.cwd(),
					loader: 'js',
				}
			})
		},
	}
}
