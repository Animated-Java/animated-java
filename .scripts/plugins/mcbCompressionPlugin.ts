import type { Plugin } from 'esbuild'
import * as fflate from 'fflate/browser'
import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import * as pathjs from 'node:path'

// One MCB source directory per Minecraft version, holding only the files that
// changed in that version. `getMCBFilesByVersion` layers them at runtime.
const MCB_SOURCE_FILES = {
	main: 'main.mcb',
	global: 'global.mcb',
	globalTemplates: 'global.mcbt',
} as const

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

			// `import SOURCES from 'mcb-sources:./some/dir'` expands to an object
			// keyed by version-directory name, each value holding the string
			// contents of whichever of main.mcb / global.mcb / global.mcbt that
			// directory provides. Adding a new version is just a new directory.
			build.onResolve({ filter: /^mcb-sources:/ }, args => {
				const dir = pathjs.join(args.resolveDir, args.path.replace(/^mcb-sources:/, ''))

				if (!existsSync(dir)) {
					return { errors: [{ text: `MCB sources directory not found: ${dir}` }] }
				}

				return { path: dir, namespace: 'mcbSources' }
			})

			build.onLoad({ filter: /.*/, namespace: 'mcbSources' }, async ({ path: dir }) => {
				const versionDirs = (await fs.readdir(dir, { withFileTypes: true }))
					.filter(entry => entry.isDirectory())
					.map(entry => entry.name)

				const imports: string[] = []
				const watchFiles: string[] = []
				const versions: Record<string, Record<string, string>> = {}

				for (const version of versionDirs) {
					const fields: Record<string, string> = {}

					for (const [field, fileName] of Object.entries(MCB_SOURCE_FILES)) {
						const filePath = pathjs.join(dir, version, fileName)
						if (!existsSync(filePath)) continue

						const ident = `mcb_${imports.length}`
						imports.push(
							`import ${ident} from ${JSON.stringify(`./${version}/${fileName}`)}`
						)
						watchFiles.push(filePath)
						fields[field] = ident
					}

					if (Object.keys(fields).length > 0) versions[version] = fields
				}

				const body = Object.entries(versions)
					.map(([version, fields]) => {
						const props = Object.entries(fields)
							.map(([field, ident]) => `${field}: ${ident}`)
							.join(', ')
						return `\t${JSON.stringify(version)}: { ${props} },`
					})
					.join('\n')

				return {
					contents: `${imports.join('\n')}\nexport default {\n${body}\n}\n`,
					loader: 'js',
					resolveDir: dir,
					watchFiles,
					watchDirs: [dir, ...versionDirs.map(version => pathjs.join(dir, version))],
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
import * as fflate from 'fflate/browser'
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
