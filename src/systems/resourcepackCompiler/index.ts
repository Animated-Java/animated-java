import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { getNextSupportedVersion, getResourcePackFormat } from '../../util/minecraftUtil'
import { IntentionalExportError } from '../exporter'
import { type IRenderedRig } from '../rigRenderer'
import type { ExportedFile } from '../util'

import { AJMeta, PackMeta, SUPPORTED_MINECRAFT_VERSIONS } from '../global'
import EXPORT_1_20_4 from './1.20.4'
import EXPORT_1_21_2 from './1.21.2'
import EXPORT_1_21_4 from './1.21.4'

const VERSIONED_RESOURCE_PACK_COMPILERS: Record<
	SUPPORTED_MINECRAFT_VERSIONS,
	ResourcePackCompiler
> = {
	'1.21.9': EXPORT_1_21_4,
	'1.21.6': EXPORT_1_21_4,
	'1.21.5': EXPORT_1_21_4,
	'1.21.4': EXPORT_1_21_4,
	'1.21.2': EXPORT_1_21_2,
	'1.20.5': EXPORT_1_20_4,
	'1.20.4': EXPORT_1_20_4,
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
	targetVersions: SUPPORTED_MINECRAFT_VERSIONS[],
	options: CompileResourcePackOptions
) {
	const aj = Project!.animated_java

	const ajmeta = new AJMeta(
		PathModule.join(options.resourcePackFolder, 'assets.ajmeta'),
		aj.export_namespace,
		Project!.last_used_export_namespace,
		options.resourcePackFolder
	)

	if (aj.resource_pack_export_mode === 'folder') {
		ajmeta.read()
	}

	const globalCoreFiles = new Map<string, ExportedFile>()
	const globalVersionSpecificFiles = new Map<string, ExportedFile>()
	const coreResourcePackFolder = options.resourcePackFolder

	for (const version of targetVersions) {
		console.groupCollapsed(`Compiling resource pack for Minecraft ${version}`)
		const coreFiles = new Map<string, ExportedFile>()
		const versionedFiles = new Map<string, ExportedFile>()

		const versionedResourcePackFolder =
			targetVersions.length > 1
				? PathModule.join(
						options.resourcePackFolder,
						`animated_java_${version.replaceAll('.', '_')}`
				  )
				: options.resourcePackFolder

		// Move paths into versioned overlay folders.
		await VERSIONED_RESOURCE_PACK_COMPILERS[version]({
			...options,
			resourcePackPath: versionedResourcePackFolder,
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
			const relative = PathModule.join(versionedResourcePackFolder, path)
			globalVersionSpecificFiles.set(relative, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.versionedFiles.add(relative)
		}

		console.groupEnd()
	}

	console.log('Exported files:', globalCoreFiles.size + globalVersionSpecificFiles.size)

	// pack.mcmeta
	const packMetaPath = PathModule.join(options.resourcePackFolder, 'pack.mcmeta')
	const packMeta = PackMeta.fromFile(packMetaPath)
	packMeta.content.pack ??= {}

	const nextVersion = getNextSupportedVersion(targetVersions[0])
	const format = getResourcePackFormat(targetVersions[0])
	const nextFormat = nextVersion ? getResourcePackFormat(nextVersion) : 10000000
	if (!compareVersions('1.21.9', targetVersions[0]) /* >= 1.21.9 */) {
		packMeta.content.pack.min_format = format
		packMeta.content.pack.max_format = nextFormat - 1
	} else {
		packMeta.content.pack.pack_format = format
		packMeta.content.pack.supported_formats = {
			min_inclusive: format,
			max_inclusive: nextFormat - 1,
		}
	}

	packMeta.content.pack.description ??= `Animated Java Resource Pack for ${targetVersions.join(
		', '
	)}`

	// if (targetVersions.length > 1) {
	// 	packMeta.content.pack.supported_formats ??= []
	// 	packMeta.content.overlays ??= {}
	// 	packMeta.content.overlays.entries ??= []

	// 	for (const version of targetVersions) {
	// 		const format: PackMetaFormats = getResourcePackFormat(version)
	// 		packMeta.content.pack.supported_formats.push(format)

	// 		const existingOverlay = packMeta.content.overlays.entries.find(
	// 			e => e.directory === `animated_java_${version.replaceAll('.', '_')}`
	// 		)
	// 		if (!existingOverlay) {
	// 			packMeta.content.overlays.entries.push({
	// 				directory: `animated_java_${version.replaceAll('.', '_')}`,
	// 				formats: format,
	// 			})
	// 		} else {
	// 			existingOverlay.formats = format
	// 		}
	// 	}
	// }

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
