import { generateNamespaceFolder } from './datapackGen/namespaceFolderGen'
import { generateAnimatedJavaFolder } from './datapackGen/animatedJavaFolderGen'
import type { loadExporter } from '../datapackExporter'
import { loadUtil } from './util'
import { Globals as G } from './datapackGen/globals'

// I am not sure if this is the best way to do this, but it works 🤓👍
type ExporterSettings = ReturnType<ReturnType<typeof loadExporter>['getSettings']>
export type ExportData = AnimatedJava.IAnimatedJavaExportData<ExporterSettings>

export interface DataPackContext {
	scoreboards: {}
}

export function loadDataPackGenerator() {
	const { formatStr, ProgressBarController, ExpectedError, LimitClock } = AnimatedJava.API
	const { NbtTag, NbtCompound, NbtString, NbtList, NbtInt } = AnimatedJava.API.deepslate
	const { fileExists, matrixToNbtFloatArray } = loadUtil()

	return async (exportData: ExportData) => {
		if (!Project?.animated_java_variants) throw new Error('No variants found')
		console.log('Export Options', exportData)
		G.loadExportData(exportData)

		console.log('Beginning export process...')

		generateNamespaceFolder()
		generateAnimatedJavaFolder()

		//--------------------------------------------
		// ANCHOR Export Data Pack
		//--------------------------------------------
		const tickFunctionTag = G.DATA_FOLDER.accessFile('minecraft/tags/functions/tick.json')
		const loadFunctionTag = G.DATA_FOLDER.accessFile('minecraft/tags/functions/load.json')

		const progress = new ProgressBarController(
			'Writing Data Pack to disk...',
			G.DATAPACK.childCount
		)

		interface IAJMeta {
			projects: Record<
				string,
				{
					// tick_functions: string[]
					// load_functions: string[]
					file_list: string[]
				}
			>
		}

		let content: IAJMeta | undefined

		const oldAJMetaPath = PathModule.join(G.DATAPACK_EXPORT_PATH, 'animated_java.mcmeta')
		const ajMetaPath = PathModule.join(G.DATAPACK_EXPORT_PATH, '.ajmeta')
		const existingMetaFile = (await fileExists(oldAJMetaPath))
			? oldAJMetaPath
			: (await fileExists(ajMetaPath))
			? ajMetaPath
			: undefined
		if (existingMetaFile !== undefined) {
			content = await fs.promises.readFile(existingMetaFile, 'utf-8').then(JSON.parse)

			if (!content.projects) {
				const message = `Failed to read the animated_java.mcdata file. (Missing projects). Please delete the file and try again.`
				Blockbench.showMessageBox({
					title: 'Failed to read .ajmeta',
					message,
				})
				throw new ExpectedError(message)
			}

			const project = content.projects[G.NAMESPACE] || {
				namespace: G.NAMESPACE,
				tick_functions: tickFunctionTag.content.values,
				load_functions: loadFunctionTag.content.values,
				file_list: [],
			}
			content.projects[G.NAMESPACE] = project

			if (!project.file_list) {
				const message = `Failed to read the animated_java.mcdata file. (Missing project file_list). Please delete the file and try again.`
				Blockbench.showMessageBox({
					title: 'Failed to read .ajmeta',
					message,
				})
				throw new ExpectedError(message)
			}

			// if (!project.tick_functions) {
			// 	const message = `Failed to read the animated_java.mcdata file. (Missing project tick_functions). Please delete the file and try again.`
			// 	Blockbench.showMessageBox({
			// 		title: 'Failed to read .ajmeta',
			// 		message,
			// 	})
			// 	throw new ExpectedError(message)
			// }

			// if (!project.load_functions) {
			// 	const message = `Failed to read the animated_java.mcdata file. (Missing project load_functions). Please delete the file and try again.`
			// 	Blockbench.showMessageBox({
			// 		title: 'Failed to read .ajmeta',
			// 		message,
			// 	})
			// 	throw new ExpectedError(message)
			// }

			progress.total += project.file_list.length
			const clock = new LimitClock(10)
			for (let path of project.file_list) {
				progress.add(1)
				await clock.sync().then(b => b && progress.update())
				if (path.endsWith('tick.json') || path.endsWith('load.json')) continue
				path = PathModule.join(G.DATAPACK_EXPORT_PATH, path)
				await fs.promises.unlink(path).catch(() => {})
				const dirPath = PathModule.dirname(path)
				const contents = await fs.promises.readdir(dirPath).catch(() => {})
				if (contents && contents.length === 0)
					await fs.promises.rmdir(dirPath).catch(() => {})
			}
			project.file_list = G.DATAPACK.getAllFilePaths()

			// tickFunctionTag.customJsonMerger = (a, b) => {
			// 	a.values = a.values.filter(v => !project.tick_functions.includes(v))
			// 	a.values.push(...b.values)
			// 	return a
			// }

			// loadFunctionTag.customJsonMerger = (a, b) => {
			// 	a.values = a.values.filter(v => !project.load_functions.includes(v))
			// 	a.values.push(...b.values)
			// 	return a
			// }

			await fs.promises.rm(existingMetaFile)
		} else {
			content = {
				projects: {
					[G.NAMESPACE]: {
						// tick_functions: tickFunctionTag.content.values,
						// load_functions: loadFunctionTag.content.values,
						file_list: G.DATAPACK.getAllFilePaths(),
					},
				},
			}
		}
		G.DATAPACK.newFile('.ajmeta', content)
		await Promise.all(
			G.DATAPACK.children.map(
				async child => await child.writeToDisk(G.DATAPACK_EXPORT_PATH, progress)
			)
		)
		progress.finish()
		console.log('Export Complete!')
	}
}
