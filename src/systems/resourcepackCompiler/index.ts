import type { Zippable } from 'fflate/browser'
import { getFsModule } from '../../constants'
import { setExportProgressPhase } from '../../dialogs/exportProgress/exportProgress'
import { IntentionalExportError } from '../errors'
import { AJMeta, PackMeta } from '../global'
import { getMisodeVersion } from '../minecraft/versionManager'
import { removeFiles, writeExportedFiles } from '../packFiles'
import { type IRenderedRig } from '../rigRenderer'
import { zip, type ExportedFile } from '../util'

import EXPORT_1_20_4 from './1.20.4'
import EXPORT_1_21_2 from './1.21.2'
import EXPORT_1_21_4 from './1.21.4'
import { checkItemModelAtlases } from './itemModelAtlases'
import { buildPaletteExport, type IPaletteExport } from './palettes'

function getResourcePackCompilerForVersion(version: string): ResourcePackCompiler {
	switch (true) {
		case VersionUtil.compare(version, '>=', '1.21.4'):
			return EXPORT_1_21_4
		case VersionUtil.compare(version, '>=', '1.21.2'):
			return EXPORT_1_21_2
		case VersionUtil.compare(version, '>=', '1.21.0'):
			return EXPORT_1_20_4
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
	/** Atlas sources and palette images for the rig's Permutation Sets. */
	paletteExport: IPaletteExport
}

export type ResourcePackCompiler = (options: ResourcePackCompilerOptions) => Promise<void>

export interface CompileResourcePackOptions {
	rig: IRenderedRig
	displayItemPath: string
	resourcePackFolder: string
	textureExportFolder: string
	modelExportFolder: string
	debugMode: boolean
	/** UUID of the Blueprint Collection the project belongs to, to tag its rig in the `.ajmeta`. */
	collectionUuid?: string
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
	ajmeta.collection = options.collectionUuid

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
	const paletteExport = buildPaletteExport(options.rig, options.textureExportFolder)
	if (options.rig.includes_custom_models) {
		await checkItemModelAtlases(options.rig, options.resourcePackFolder, paletteExport)
	}
	await resourcePackCompiler({
		...options,
		paletteExport,
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

	const format = misodeVersionData.resource_pack_version
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

	if (aj.resource_pack_export_mode === 'folder') {
		const exportedFiles = new Map<string, ExportedFile>([
			...globalCoreFiles,
			...globalVersionSpecificFiles,
		])

		const staleFiles = [...ajmeta.previousVersionedFiles].filter(f => !exportedFiles.has(f))
		setExportProgressPhase('Removing Old Resource Pack Files...', staleFiles.length)
		await removeFiles(staleFiles)

		ajmeta.coreFiles = new Set(globalCoreFiles.keys())
		ajmeta.versionedFiles = new Set(globalVersionSpecificFiles.keys())
		ajmeta.write()

		setExportProgressPhase('Writing Resource Pack...', exportedFiles.size)
		const written = await writeExportedFiles(exportedFiles)
		console.log(
			`Wrote ${written} of ${exportedFiles.size} resource pack files, removed ${staleFiles.length}`
		)
	} else if (aj.resource_pack_export_mode === 'zip') {
		const data: Zippable = {}

		for (const [path, file] of coreFiles.entries()) {
			const content = Uint8Array.from(
				typeof file.content === 'string' ? Buffer.from(file.content) : file.content
			)
			data[path] = content
		}

		for (const [path, file] of versionedFiles.entries()) {
			const content = Uint8Array.from(
				typeof file.content === 'string' ? Buffer.from(file.content) : file.content
			)
			data[path] = content
		}

		data['pack.mcmeta'] = Uint8Array.from(
			Buffer.from(autoStringify(packMeta.toJSON()), 'utf-8')
		)

		const { rm, writeFile } = getFsModule().promises
		await rm(options.resourcePackFolder, { recursive: true, force: true })
		const zipped = await zip(data, {})
		await writeFile(options.resourcePackFolder, zipped)
	}
}
