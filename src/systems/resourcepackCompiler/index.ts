import { fs } from '../../constants'
import {
	MAX_PROGRESS,
	PROGRESS,
	PROGRESS_DESCRIPTION,
} from '../../dialogs/exportProgress/exportProgress'
import { IntentionalExportError } from '../errors'
import { type IRenderedRig } from '../rigRenderer'
import type { ExportedFile } from '../util'

import { AJMeta, PackMeta } from '../global'
import { getMisodeVersion } from '../minecraft/versionManager'
import EXPORT_1_20_4 from './1.20.4'
import EXPORT_1_21_2 from './1.21.2'
import EXPORT_1_21_4 from './1.21.4'

function getResourcePackCompilerForVersion(version: string): ResourcePackCompiler {
	switch (true) {
		case VersionUtil.compare(version, '>=', '1.21.4'):
			return EXPORT_1_21_4
		case VersionUtil.compare(version, '>=', '1.21.2'):
			return EXPORT_1_21_2
		case VersionUtil.compare(version, '>=', '1.21.0'):
			return EXPORT_1_21_2
		case VersionUtil.compare(version, '>=', '1.20.5'):
			return EXPORT_1_20_4
		case VersionUtil.compare(version, '>=', '1.20.4'):
			return EXPORT_1_20_4
		default:
			throw new IntentionalExportError(`Unsupported Minecraft version: ${version}`)
	}
}

interface ResourcePackCompilerOptions {
	ajmeta: AJMeta
	coreFiles: Map<string, ExportedFile>
	versionedFiles: Map<string, ExportedFile>
	rig: IRenderedRig
	resourcePackPath: string
	displayItemPath: string
	textureExportFolder: string
	modelExportFolder: string
	debugMode: boolean
}

export type ResourcePackCompiler = (options: ResourcePackCompilerOptions) => Promise<void>

export interface CompileResourcePackOptions {
	rig: IRenderedRig
	displayItemPath: string
	resourcePackFolder: string
	textureExportFolder: string
	modelExportFolder: string
	debugMode: boolean
}

export default async function compileResourcePack(
	version: string,
	options: CompileResourcePackOptions
) {
	const aj = Project!.animated_java

	const ajmeta = new AJMeta(
		PathModule.join(options.resourcePackFolder, 'assets.ajmeta'),
		aj.blueprint_id,
		Project!.last_used_blueprint_id,
		options.resourcePackFolder
	)

	if (aj.resource_pack_export_mode === 'folder') {
		ajmeta.read()
	}

	const globalCoreFiles = new Map<string, ExportedFile>()
	const globalVersionSpecificFiles = new Map<string, ExportedFile>()
	const coreResourcePackFolder = options.resourcePackFolder

	console.groupCollapsed(`Compiling resource pack for Minecraft ${version}`)
	const coreFiles = new Map<string, ExportedFile>()
	const versionedFiles = new Map<string, ExportedFile>()

	const resourcePackCompiler = getResourcePackCompilerForVersion(version)
	await resourcePackCompiler({
		...options,
		resourcePackPath: options.resourcePackFolder,
		ajmeta,
		coreFiles,
		versionedFiles,
	})

	for (const [path, file] of coreFiles) {
		const relative = PathModule.join(coreResourcePackFolder, path)
		globalCoreFiles.set(relative, file)
		if (file.includeInAJMeta === false) continue
		ajmeta.coreFiles.add(relative)
	}

	for (const [path, file] of versionedFiles) {
		const relative = PathModule.join(options.resourcePackFolder, path)
		globalVersionSpecificFiles.set(relative, file)
		if (file.includeInAJMeta === false) continue
		ajmeta.versionedFiles.add(relative)
	}

	console.groupEnd()

	console.log('Exported files:', globalCoreFiles.size + globalVersionSpecificFiles.size)

	// pack.mcmeta
	const packMetaPath = PathModule.join(options.resourcePackFolder, 'pack.mcmeta')
	const packMeta = PackMeta.fromFile(packMetaPath)
	packMeta.content.pack ??= {}

	const misodeVersionData = await getMisodeVersion(version)

	const format = misodeVersionData.data_pack_version
	if (VersionUtil.compare(version, '>=', '1.21.9')) {
		packMeta.content.pack.min_format = format
		packMeta.content.pack.max_format = format
	} else {
		packMeta.content.pack.pack_format = format
		packMeta.content.pack.supported_formats = {
			min_inclusive: format,
			max_inclusive: format,
		}
	}

	packMeta.content.pack.description ??= `Animated Java Resource Pack for ${version}`

	globalCoreFiles.set(PathModule.join(options.resourcePackFolder, 'pack.mcmeta'), {
		content: autoStringify(packMeta.toJSON()),
	})

	if (aj.enable_plugin_mode) {
		// Do nothing
		console.log('Plugin mode enabled. Skipping resource pack export.')
	} else if (aj.resource_pack_export_mode === 'folder') {
		// Clean up old files
		PROGRESS_DESCRIPTION.set('Removing Old Resource Pack Files...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(ajmeta.previousVersionedFiles.size)

		const removedFolders = new Set<string>()
		for (const file of ajmeta.previousVersionedFiles) {
			if (fs.existsSync(file)) await fs.promises.unlink(file)
			let folder = PathModule.dirname(file)
			while (
				!removedFolders.has(folder) &&
				fs.existsSync(folder) &&
				(await fs.promises.readdir(folder)).length === 0
			) {
				await fs.promises.rm(folder, { recursive: true })
				removedFolders.add(folder)
				folder = PathModule.dirname(folder)
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}

		// Write new files
		ajmeta.coreFiles = new Set(globalCoreFiles.keys())
		ajmeta.versionedFiles = new Set(globalVersionSpecificFiles.keys())
		ajmeta.write()

		const exportedFiles = new Map<string, ExportedFile>([
			...globalCoreFiles,
			...globalVersionSpecificFiles,
		])

		PROGRESS_DESCRIPTION.set('Writing Resource Pack...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(exportedFiles.size)
		const createdFolderCache = new Set<string>()

		for (const [path, file] of exportedFiles) {
			const folder = PathModule.dirname(path)
			if (!createdFolderCache.has(folder)) {
				await fs.promises.mkdir(folder, { recursive: true })
				createdFolderCache.add(folder)
			}
			if (file.writeHandler) {
				await file.writeHandler(path, file.content)
			} else {
				await fs.promises.writeFile(
					path,
					new Uint8Array(
						Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content)
					)
				)
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}
	} else if (aj.resource_pack_export_mode === 'zip') {
		throw new IntentionalExportError('ZIP export is not yet implemented.')
	}
}
