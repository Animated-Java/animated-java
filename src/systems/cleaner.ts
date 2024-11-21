import { isFunctionTagPath } from '../util/fileUtil'
import { IFunctionTag, parseDataPackPath } from '../util/minecraftUtil'
import { DataPackAJMeta } from './datapackCompiler'
import { getExportPaths } from './exporter'
import { ResourcePackAJMeta } from './resourcepackCompiler/global'
import { replacePathPart } from './util'

export async function cleanupExportedFiles() {
	const aj = Project!.animated_java
	const {
		resourcePackFolder,
		dataPackFolder,
		// textureExportFolder,
		// modelExportFolder,
		// displayItemPath,
	} = getExportPaths()

	if (aj.resource_pack_export_mode === 'raw') {
		const assetsMetaPath = PathModule.join(resourcePackFolder, 'assets.ajmeta')
		const assetsMeta = new ResourcePackAJMeta(
			assetsMetaPath,
			aj.export_namespace,
			Project!.last_used_export_namespace,
			resourcePackFolder
		)
		assetsMeta.read()

		// PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		// PROGRESS.set(0)
		// MAX_PROGRESS.set(assetsMeta.oldFiles.size)
		const removedFolders = new Set<string>()
		for (const file of assetsMeta.oldFiles) {
			if (!isFunctionTagPath(file)) {
				if (fs.existsSync(file)) await fs.promises.unlink(file)
			} else if (aj.export_namespace !== Project!.last_used_export_namespace) {
				const resourceLocation = parseDataPackPath(file)!.resourceLocation
				if (
					resourceLocation.startsWith(
						`animated_java:${Project!.last_used_export_namespace}/`
					) &&
					fs.existsSync(file)
				) {
					const newPath = replacePathPart(
						file,
						Project!.last_used_export_namespace,
						aj.export_namespace
					)
					await fs.promises.mkdir(PathModule.dirname(newPath), { recursive: true })
					await fs.promises.copyFile(file, newPath)
					await fs.promises.unlink(file)
				}
			}
			let folder = PathModule.dirname(file)
			while (
				!removedFolders.has(folder) &&
				fs.existsSync(folder) &&
				(await fs.promises.readdir(folder)).length === 0
			) {
				await fs.promises.rm(folder, { recursive: true })
				removedFolders.add(folder)
				folder = PathModule.dirname(folder)
				if (PathModule.basename(folder) === 'assets') break
			}
			// PROGRESS.set(PROGRESS.get() + 1)
		}

		assetsMeta.write()
	}

	if (aj.data_pack_export_mode === 'raw') {
		const dataMetaPath = PathModule.join(dataPackFolder, 'data.ajmeta')
		const dataMeta = new DataPackAJMeta(
			dataMetaPath,
			aj.export_namespace,
			Project!.last_used_export_namespace,
			dataPackFolder
		)
		dataMeta.read()

		// PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		// PROGRESS.set(0)
		// MAX_PROGRESS.set(dataMeta.oldFiles.size)
		const removedFolders = new Set<string>()
		for (const file of dataMeta.oldFiles) {
			if (isFunctionTagPath(file) && fs.existsSync(file)) {
				if (aj.export_namespace !== Project!.last_used_export_namespace) {
					const resourceLocation = parseDataPackPath(file)!.resourceLocation
					if (
						resourceLocation.startsWith(
							`animated_java:${Project!.last_used_export_namespace}/`
						)
					) {
						const newPath = replacePathPart(
							file,
							Project!.last_used_export_namespace,
							aj.export_namespace
						)
						await fs.promises.mkdir(PathModule.dirname(newPath), { recursive: true })
						await fs.promises.copyFile(file, newPath)
						await fs.promises.unlink(file)
					}
				}
				// Remove mentions of the export namespace from the file
				const content: IFunctionTag = JSON.parse(
					(await fs.promises.readFile(file)).toString()
				)
				content.values = content.values.filter(
					v =>
						typeof v === 'string' &&
						(!v.startsWith(`animated_java:${aj.export_namespace}/`) ||
							!v.startsWith(`animated_java:${Project!.last_used_export_namespace}/`))
				)
				await fs.promises.writeFile(file, autoStringify(content))
			} else {
				// Delete the file
				if (fs.existsSync(file)) await fs.promises.unlink(file)
			}
			let folder = PathModule.dirname(file)
			while (
				!removedFolders.has(folder) &&
				fs.existsSync(folder) &&
				(await fs.promises.readdir(folder)).length === 0
			) {
				await fs.promises.rm(folder, { recursive: true })
				removedFolders.add(folder)
				folder = PathModule.dirname(folder)
				if (PathModule.basename(folder) === 'data') break
			}
			// PROGRESS.set(PROGRESS.get() + 1)
		}

		dataMeta.write()
	}

	Blockbench.showQuickMessage('Exported files extracted successfully!', 2000)
}
