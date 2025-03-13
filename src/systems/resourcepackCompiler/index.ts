import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { getResourcePackFormat } from '../../util/minecraftUtil'
import { MinecraftVersion } from '../datapackCompiler/mcbFiles'
import { type IRenderedRig } from '../rigRenderer'
import { IPackMeta, PackMetaFormats } from '../util'

import _1_20_4 from './1.20.4'
import _1_21_2 from './1.21.2'
import _1_21_4 from './1.21.4'
import { ResourcePackAJMeta } from './global'

const VERSIONS = {
	'1.20.4': _1_20_4,
	'1.20.5': _1_20_4,
	'1.21.0': _1_20_4,
	'1.21.2': _1_21_2,
	'1.21.4': _1_21_4,
}

interface ResourcePackCompilerOptions {
	ajmeta: ResourcePackAJMeta
	coreFiles: Map<string, ExportedFile>
	versionedFiles: Map<string, ExportedFile>
	rig: IRenderedRig
	displayItemPath: string
	textureExportFolder: string
	modelExportFolder: string
}

export type ResourcePackCompiler = (options: ResourcePackCompilerOptions) => Promise<void>

interface ExportedFile {
	content: string | Buffer
	includeInAJMeta?: boolean
	writeHandler?: (path: string, content: string | Buffer) => Promise<void>
}

export interface CompileResourcePackOptions {
	rig: IRenderedRig
	displayItemPath: string
	resourcePackFolder: string
	textureExportFolder: string
	modelExportFolder: string
}

export default async function compileResourcePack(
	targetVersions: MinecraftVersion[],
	options: CompileResourcePackOptions
) {
	const aj = Project!.animated_java

	const ajmeta = new ResourcePackAJMeta(
		PathModule.join(options.resourcePackFolder, 'assets.ajmeta'),
		aj.export_namespace,
		Project!.last_used_export_namespace,
		options.resourcePackFolder
	)

	if (aj.resource_pack_export_mode === 'raw') {
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
		await VERSIONS[version]({
			...options,
			ajmeta,
			coreFiles,
			versionedFiles,
		})

		for (let [path, file] of coreFiles) {
			path = PathModule.join(coreResourcePackFolder, path)
			globalCoreFiles.set(path, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.coreFiles.add(path)
		}

		for (let [path, file] of versionedFiles) {
			path = PathModule.join(versionedResourcePackFolder, path)
			globalVersionSpecificFiles.set(path, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.versionedFiles.add(path)
		}

		console.groupEnd()
	}

	console.log('Exported files:', globalVersionSpecificFiles.size)

	// pack.mcmeta
	const packMetaPath = PathModule.join(options.resourcePackFolder, 'pack.mcmeta')
	let packMeta = {} as IPackMeta
	if (fs.existsSync(packMetaPath)) {
		try {
			const content = fs.readFileSync(packMetaPath, 'utf-8')
			packMeta = JSON.parse(content)
		} catch (e) {
			console.error('Failed to parse pack.mcmeta:', e)
		}
	}
	packMeta.pack ??= {}
	// Latest pack format
	packMeta.pack.pack_format = getResourcePackFormat(aj.target_minecraft_versions[0])
	packMeta.pack.supported_formats = []
	packMeta.pack.description ??= `Animated Java Data Pack for ${aj.target_minecraft_versions.join(
		', '
	)}`
	packMeta.overlays ??= {}
	packMeta.overlays.entries ??= []

	for (const version of aj.target_minecraft_versions) {
		let format: PackMetaFormats = getResourcePackFormat(version)
		packMeta.pack.supported_formats.push(format)

		const existingOverlay = packMeta.overlays.entries.find(
			e => e.directory === `animated_java_${version.replaceAll('.', '_')}`
		)
		if (!existingOverlay) {
			packMeta.overlays.entries.push({
				directory: `animated_java_${version.replaceAll('.', '_')}`,
				formats: format,
			})
		} else {
			existingOverlay.formats = format
		}
	}

	globalCoreFiles.set(PathModule.join(options.resourcePackFolder, 'pack.mcmeta'), {
		content: autoStringify(packMeta),
	})

	if (aj.enable_plugin_mode) {
		// Do nothing
		console.log('Plugin mode enabled. Skipping resource pack export.')
	} else if (aj.resource_pack_export_mode === 'raw') {
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
				await fs.promises.writeFile(path, file.content)
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}
	} else if (aj.resource_pack_export_mode === 'zip') {
		throw new Error('ZIP export is not yet implemented.')
		// exportedFiles.set(
		// 	PathModule.join(options.resourcePackFolder, 'pack.mcmeta'),
		// 	autoStringify({
		// 		pack: {
		// 			// FIXME - This should be a setting
		// 			pack_format: 32,
		// 			description: `${Project!.name}. Generated with Animated Java`,
		// 		},
		// 	})
		// )

		// PROGRESS_DESCRIPTION.set('Writing Resource Pack Zip...')
		// const data: Record<string, Uint8Array> = {}
		// for (const [path, file] of exportedFiles) {
		// 	const relativePath = PathModule.relative(options.resourcePackFolder, path)
		// 	if (typeof file === 'string') {
		// 		data[relativePath] = Buffer.from(file)
		// 	} else {
		// 		data[relativePath] = file
		// 	}
		// }
		// const zipped = await zip(data, {})
		// await fs.promises.writeFile(
		// 	options.resourcePackFolder + (options.resourcePackFolder.endsWith('.zip') ? '' : '.zip'),
		// 	zipped
		// )
	}
}
