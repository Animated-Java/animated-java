import { getFsModule } from '../constants'
import { isFunctionTagPath } from '../util/fileUtil'
import { type FunctionTagJSON, parseDataPackPath } from '../util/minecraftUtil'
import { getExportPaths } from './exporter'
import { AJMeta } from './global'
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
	const { existsSync, promises } = getFsModule()
	const { unlink, mkdir, copyFile, readFile, writeFile, readdir, rm } = promises

	if (aj.resource_pack_export_mode === 'folder') {
		const assetsMetaPath = PathModule.join(resourcePackFolder, 'assets.ajmeta')
		const assetsMeta = new AJMeta(
			assetsMetaPath,
			aj.blueprint_id,
			Project!.last_used_blueprint_id,
			resourcePackFolder
		)
		assetsMeta.read()

		// PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		// PROGRESS.set(0)
		// MAX_PROGRESS.set(assetsMeta.oldFiles.size)
		const removedFolders = new Set<string>()
		for (const file of assetsMeta.previousVersionedFiles) {
			if (!isFunctionTagPath(file)) {
				if (existsSync(file)) await unlink(file)
			} else if (aj.blueprint_id !== Project!.last_used_blueprint_id) {
				const resourceLocation = parseDataPackPath(file)!.resourceLocation
				if (
					resourceLocation.startsWith(
						`animated_java:${Project!.last_used_blueprint_id}/`
					) &&
					existsSync(file)
				) {
					const newPath = replacePathPart(
						file,
						Project!.last_used_blueprint_id,
						aj.blueprint_id
					)
					await mkdir(PathModule.dirname(newPath), { recursive: true })
					await copyFile(file, newPath)
					await unlink(file)
				}
			}
			let folder = PathModule.dirname(file)
			while (
				!removedFolders.has(folder) &&
				existsSync(folder) &&
				(await readdir(folder)).length === 0
			) {
				await rm(folder, { recursive: true })
				removedFolders.add(folder)
				folder = PathModule.dirname(folder)
				if (PathModule.basename(folder) === 'assets') break
			}
			// PROGRESS.set(PROGRESS.get() + 1)
		}

		assetsMeta.write()
	}

	if (aj.data_pack_export_mode === 'folder') {
		const dataMetaPath = PathModule.join(dataPackFolder, 'data.ajmeta')
		const dataMeta = new AJMeta(
			dataMetaPath,
			aj.blueprint_id,
			Project!.last_used_blueprint_id,
			dataPackFolder
		)
		dataMeta.read()

		// PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		// PROGRESS.set(0)
		// MAX_PROGRESS.set(dataMeta.oldFiles.size)
		const removedFolders = new Set<string>()
		for (const file of [...dataMeta.previousCoreFiles, ...dataMeta.previousVersionedFiles]) {
			if (isFunctionTagPath(file) && existsSync(file)) {
				if (aj.blueprint_id !== Project!.last_used_blueprint_id) {
					const resourceLocation = parseDataPackPath(file)!.resourceLocation
					if (
						resourceLocation.startsWith(
							`animated_java:${Project!.last_used_blueprint_id}/`
						)
					) {
						const newPath = replacePathPart(
							file,
							Project!.last_used_blueprint_id,
							aj.blueprint_id
						)
						await mkdir(PathModule.dirname(newPath), { recursive: true })
						await copyFile(file, newPath)
						await unlink(file)
					}
				}
				// Remove mentions of the export namespace from the file
				const content: FunctionTagJSON = JSON.parse((await readFile(file)).toString())
				content.values = content.values.filter(
					v =>
						typeof v === 'string' &&
						(!v.startsWith(`animated_java:${aj.blueprint_id}/`) ||
							!v.startsWith(`animated_java:${Project!.last_used_blueprint_id}/`))
				)
				await writeFile(file, autoStringify(content))
			} else {
				// Delete the file
				if (existsSync(file)) await unlink(file)
			}
			let folder = PathModule.dirname(file)
			while (
				!removedFolders.has(folder) &&
				existsSync(folder) &&
				(await readdir(folder)).length === 0
			) {
				await rm(folder, { recursive: true })
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
