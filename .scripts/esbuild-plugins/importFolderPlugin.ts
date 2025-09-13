import type { Plugin } from 'esbuild'
import * as fs from 'fs'
import * as pathjs from 'path'

interface IRecursiveDirEntry {
	// The file's name with extension
	name: string
	// The file's extension
	ext: string
	// The file's absolute path
	path: string
	// The parent directory's absolute path
	parentPath: string
	// The file's path relative to the directory being recursed
	localPath: string
}

interface IRecursiveReadDirSyncOptions {
	encoding?: fs.ObjectEncodingOptions['encoding']
	maxDepth?: number
	filter?: (file: IRecursiveDirEntry) => boolean
}

/**
 * Recursively reads a directory and returns an array of file information.
 * @param dir The directory to read.
 * @param encoding The encoding to use when reading file names.
 * @param maxDepth The maximum depth to recurse into subdirectories.
 * @returns An array of file information objects.
 */
function recursiveReadDirSync(
	dir: string,
	{ encoding = 'utf-8', maxDepth = 200, filter }: IRecursiveReadDirSyncOptions
): IRecursiveDirEntry[] {
	const files: IRecursiveDirEntry[] = []

	function recurse(localDir: string, depth = 0) {
		// If a local index is found, it is imported and the rest of the directory is ignored.
		const indexPath = pathjs.join(localDir, 'index.ts')
		if (fs.existsSync(indexPath)) {
			const absolutePath = pathjs.resolve(localDir, 'index.ts')
			files.push({
				name: 'index',
				ext: '.ts',
				path: absolutePath,
				parentPath: localDir,
				localPath: pathjs.relative(dir, absolutePath),
			})
			return
		}

		fs.readdirSync(localDir, { encoding, withFileTypes: true }).forEach(dirEntry => {
			const absolutePath = pathjs.join(localDir, dirEntry.name)
			if (dirEntry.isDirectory() && depth <= maxDepth) {
				recurse(absolutePath, depth + 1)
			} else {
				const fileEntry: IRecursiveDirEntry = {
					name: dirEntry.name,
					ext: pathjs.extname(dirEntry.name),
					path: absolutePath,
					parentPath: pathjs.dirname(absolutePath),
					localPath: pathjs.relative(dir, absolutePath),
				}
				if (!!filter && !filter(fileEntry)) return
				files.push(fileEntry)
			}
		})
	}
	recurse(dir)

	return files
}

function normalizePathToPosix(path: string) {
	return path.replaceAll(pathjs.sep, pathjs.posix.sep)
}

/**
 * A plugin for importing all files in a folder without manually updating an index file.
 * To recurse into subdirectories, use the `//` suffix.
 *
 * NOTE - If you're using a glob plugin, this plugin should be executed first.
 */
const plugin: Plugin = {
	name: 'import-folder',
	setup: build => {
		build.onResolve({ filter: /.+\/\/?$/, namespace: 'file' }, args => {
			const fullPath = normalizePathToPosix(pathjs.join(args.resolveDir, args.path))

			const stat = fs.statSync(fullPath)
			if (!stat.isDirectory()) {
				return {
					errors: [
						{
							text: `"${fullPath}" is not a directory, but is being imported with a "/" suffix.`,
							location: { file: args.importer },
						},
					],
				}
			}

			return {
				namespace: 'import-folder',
				path: fullPath,
				pluginData: { recursive: args.path.endsWith('//'), importer: args.importer },
			}
		})

		build.onLoad({ filter: /.+\/\/?$/, namespace: 'import-folder' }, args => {
			let files: IRecursiveDirEntry[]

			const filter: IRecursiveReadDirSyncOptions['filter'] = file => {
				return file.ext === '.js' || file.ext === '.ts'
			}

			if (args.pluginData.recursive) {
				files = recursiveReadDirSync(args.path, { encoding: 'utf-8', filter })
			} else {
				files = recursiveReadDirSync(args.path, { encoding: 'utf-8', filter, maxDepth: 0 })
			}

			const contents = files
				.map(file => `import './${normalizePathToPosix(file.localPath)}';`)
				.join('\n')

			console.log(
				`📃 ${normalizePathToPosix(
					pathjs.relative(process.cwd(), args.pluginData.importer)
				)} imports folder ${normalizePathToPosix(
					pathjs.relative(process.cwd(), args.path)
				)}${args.pluginData.recursive ? ' recursively' : ''}.`
			)

			return {
				loader: 'js',
				contents,
				watchFiles: files.map(file => pathjs.join(file.parentPath, file.name)),
				resolveDir: args.path,
			}
		})
	},
}

export default plugin
