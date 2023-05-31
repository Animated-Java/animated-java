import { fileExists, loadJsonFile, recursivelyRemoveEmptyFolders } from '../util'
import { generateTags } from './function_tags'
import { generateFunctions } from './functions'
import { Globals as G, util } from './globals'

export interface IFolders {
	datapack: AnimatedJava.VirtualFolder
	data: AnimatedJava.VirtualFolder
	minecraft: {
		root: AnimatedJava.VirtualFolder
		functions: AnimatedJava.VirtualFolder
		tags: AnimatedJava.VirtualFolder
	}
	animatedJava: {
		root: AnimatedJava.VirtualFolder
		functions: AnimatedJava.VirtualFolder
		tags: AnimatedJava.VirtualFolder
	}
	project: {
		functions: AnimatedJava.VirtualFolder
		internalFunctions: AnimatedJava.VirtualFolder
		tags: AnimatedJava.VirtualFolder
	}
}

export interface IAJMeta {
	datapack: {
		projects: Record<
			string, // UUID
			{
				project_name: string
				files: string[]
			}
		>
	}
	resourcepack: object
}

async function loadAJMeta() {
	let ajMeta: IAJMeta
	const oldPath = PathModule.join(G.DATAPACK_EXPORT_PATH, '.ajmeta')
	const newPath = PathModule.join(G.DATAPACK_EXPORT_PATH, '.ajmeta')
	const path = (await fileExists(oldPath)) ? oldPath : newPath

	if (await fileExists(path)) {
		ajMeta = await loadJsonFile(path).catch(e => {
			console.warn(`Failed to load .ajmeta file:\n${e.stack}`)
		})
	}
	if (!ajMeta) ajMeta = {} as IAJMeta

	ajMeta.datapack ??= { projects: {} }
	ajMeta.datapack.projects ??= {}

	if (path === oldPath) await fs.promises.rm(path).catch(() => {})

	return ajMeta
}

async function processAJMeta(folders: IFolders) {
	const { LimitClock } = AnimatedJava.API
	const ajMetaContent = await loadAJMeta()

	let project =
		ajMetaContent.datapack.projects[Project!.animated_java_uuid!] ??
		({} as IAJMeta['datapack']['projects'][string])
	ajMetaContent.datapack.projects[Project!.animated_java_uuid!] = project
	project.project_name = G.PROJECT_NAME
	project.files ??= []

	const oldFiles = project.files
	const newFiles = folders.datapack.getAllFilePaths()
	const filesToRemove = oldFiles.filter(f => !newFiles.includes(f))

	const progress = new AnimatedJava.API.ProgressBarController(
		'Cleaning up datapack...',
		filesToRemove.length
	)
	const clock = new LimitClock(10)
	for (const file of filesToRemove) {
		await clock.sync().then(waiting => waiting && progress.update())
		const path = PathModule.join(G.DATAPACK_EXPORT_PATH, file)
		console.log(`Removing ${path}`)
		await fs.promises.rm(path).catch(() => {})
		if ((await fs.promises.readdir(PathModule.dirname(path)).catch(() => [])).length === 0) {
			await recursivelyRemoveEmptyFolders(PathModule.dirname(path))
		}
		progress.add(1)
	}
	progress.finish()

	project.files = newFiles

	folders.datapack.newFile('.ajmeta', ajMetaContent)
}

export async function generateDatapack(exportData: ExportData) {
	const { VirtualFileSystem } = AnimatedJava.API
	G.initializeExport(exportData)

	const folders = {} as IFolders
	folders.datapack = new VirtualFileSystem.VirtualFolder('internal_datapack_folder')
	folders.data = folders.datapack.newFolder('data')

	folders.minecraft = {} as IFolders['minecraft']
	folders.minecraft.root = folders.data.newFolder('minecraft')
	folders.minecraft.functions = folders.minecraft.root.newFolder('functions')
	folders.minecraft.tags = folders.minecraft.root.newFolder('tags')

	folders.animatedJava = {} as IFolders['animatedJava']
	folders.animatedJava.root = folders.data.newFolder('animated_java')
	folders.animatedJava.functions = folders.animatedJava.root.newFolder('functions')
	folders.animatedJava.tags = folders.animatedJava.root.newFolder('tags')

	folders.project = {} as IFolders['project']
	folders.project.functions = folders.animatedJava.functions.newFolder(G.PROJECT_NAME)
	folders.project.tags = folders.animatedJava.tags.newFolder(G.PROJECT_NAME)
	folders.project.internalFunctions = folders.project.functions.newFolder('zzzzzzzz')

	generateFunctions(folders)
	generateTags(folders)

	await processAJMeta(folders)

	console.log(folders.datapack)

	const writeProgress = new AnimatedJava.API.ProgressBarController(
		'Writing datapack to disk',
		folders.datapack.childCount
	)
	await folders.datapack.writeChildrenToDisk(G.DATAPACK_EXPORT_PATH, { skipEmptyFolders: true })
	writeProgress.finish()
}
