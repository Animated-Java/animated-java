import { getFsModule } from '../constants'
import { PROGRESS, PROGRESS_DETAIL } from '../dialogs/exportProgress/exportProgress'
import type { ExportedFile } from './util'

const MAX_PARALLEL_WRITES = 8

/**
 * Writes `content` to `path`, unless the file already holds exactly those bytes.
 * @returns Whether the file was written.
 */
export async function writeFileIfChanged(path: string, content: string | Buffer) {
	const { mkdir, readFile, stat, writeFile } = getFsModule().promises
	const bytes = new Uint8Array(Buffer.isBuffer(content) ? content : Buffer.from(content))
	const size = await stat(path).then(
		stats => stats.size,
		() => undefined
	)
	if (size === bytes.length && (await readFile(path)).equals(bytes)) return false
	if (size === undefined) await mkdir(PathModule.dirname(path), { recursive: true })
	await writeFile(path, bytes)
	return true
}

async function writeExportedFile(path: string, file: ExportedFile) {
	if (!file.writeHandler) return writeFileIfChanged(path, file.content)
	await getFsModule().promises.mkdir(PathModule.dirname(path), { recursive: true })
	await file.writeHandler(path, file.content)
	return true
}

/**
 * Writes every file whose content differs from what's on disk and advances export progress.
 * @returns How many files were written.
 */
export async function writeExportedFiles(files: Map<string, ExportedFile>) {
	let written = 0
	const queue = new Set<Promise<void>>()
	for (const [path, file] of files) {
		const task: Promise<void> = writeExportedFile(path, file)
			.then(didWrite => {
				if (didWrite) written++
				PROGRESS_DETAIL.set(PathModule.basename(path))
				PROGRESS.set(PROGRESS.get() + 1)
			})
			.finally(() => queue.delete(task))
		queue.add(task)
		if (queue.size >= MAX_PARALLEL_WRITES) await Promise.race(queue)
	}
	await Promise.all(queue)
	return written
}

/**
 * Deletes `files`, and any folders their removal leaves empty and advances export progress.
 */
export async function removeFiles(files: Iterable<string>) {
	const { existsSync, promises } = getFsModule()
	const { readdir, rm, unlink } = promises
	const removedFolders = new Set<string>()
	for (const file of files) {
		PROGRESS_DETAIL.set(PathModule.basename(file))
		if (existsSync(file)) await unlink(file)
		let folder = PathModule.dirname(file)
		while (
			!removedFolders.has(folder) &&
			existsSync(folder) &&
			(await readdir(folder)).length === 0
		) {
			await rm(folder, { recursive: true })
			removedFolders.add(folder)
			folder = PathModule.dirname(folder)
		}
		PROGRESS.set(PROGRESS.get() + 1)
	}
}
