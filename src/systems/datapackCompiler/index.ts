import { TextComponent } from 'book-and-quill'
import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtList, NbtString } from 'deepslate/lib/nbt'
import type { AsyncZippable } from 'fflate/browser'
import { getFsModule } from '../../constants'
import {
	MAX_PROGRESS,
	PROGRESS,
	PROGRESS_DESCRIPTION,
} from '../../dialogs/exportProgress/exportProgress'
import { projectTargetVersionIsAtLeast } from '../../formats/blueprint'
import { DisplayEntityConfig } from '../../nodeConfigs'
import { isFunctionTagPath } from '../../util/fileUtil'
import {
	DataPackTag,
	type FunctionTagJSON,
	parseBlock,
	parseDataPackPath,
	parseResourceLocation,
} from '../../util/minecraftUtil'
import { eulerFromQuaternion, roundTo } from '../../util/misc'
import { MSLimiter } from '../../util/msLimiter'
import { Variant } from '../../variants'
import type { IRenderedAnimation } from '../animationRenderer'
import { getMCBFilesByVersion } from '../datapackCompiler/mcbFiles'
import { IntentionalExportError } from '../errors'
import { AJMeta, PackMeta } from '../global'
import { getMisodeVersion } from '../minecraft/versionManager'
import type { AnyRenderedNode, IRenderedRig } from '../rigRenderer'
import {
	arrayToNbtFloatArray,
	type ExportedFile,
	matrixToNbtFloatArray,
	replacePathPart,
	transformationToNbt,
	zip,
} from '../util'
import ENTITY_NAMES from './entityNames'
import { compileMcbProject } from './mcbCompiler'
import OBJECTIVES from './objectives'
import TAGS, { getNodeTags, getRootEntityTags } from './tags'
import TELLRAW from './tellraw'

const BONE_TYPES = ['bone', 'text_display', 'item_display', 'block_display']

async function generateRootEntityPassengers(version: string, rig: IRenderedRig) {
	const aj = Project!.animated_java
	const passengers: NbtList = new NbtList()

	for (const [uuid, node] of Object.entries(rig.nodes)) {
		if (node.type === 'struct') continue

		const passenger = new NbtCompound()

		const tags = getNodeTags(node, rig)
		passenger.set('Tags', tags)

		if (BONE_TYPES.includes(node.type)) {
			passenger
				.set('height', new NbtFloat(aj.render_box[1]))
				.set('width', new NbtFloat(aj.render_box[0]))
				.set('teleport_duration', new NbtInt(0))
				.set('interpolation_duration', new NbtInt(aj.interpolation_duration))
				.set(
					'transformation',
					new NbtCompound()
						.set('translation', arrayToNbtFloatArray([0, 0, 0]))
						.set('left_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
						.set('right_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
						.set('scale', arrayToNbtFloatArray([0, 0, 0]))
				)
		}

		switch (node.type) {
			case 'bone': {
				const item = new NbtCompound().set('id', new NbtString(aj.display_item))
				passenger
					.set('id', new NbtString('minecraft:item_display'))
					.set('item', item)
					.set('item_display', new NbtString('head'))

				const variantModel = rig.variants[Variant.getDefault().uuid].models[uuid]
				if (!variantModel) {
					throw new Error(`Model for bone '${node.storage_name}' not found!`)
				}

				if (!compareVersions('1.21.4', version) /* >= 1.21.4 */) {
					item.set(
						'components',
						new NbtCompound()
							.set('minecraft:item_model', new NbtString(variantModel.item_model))
							.set(
								'minecraft:custom_model_data',
								new NbtCompound().set(
									'strings',
									new NbtList([new NbtString('default')])
								)
							)
					)
				} else if (!compareVersions('1.21.2', version) /* >= 1.21.2 */) {
					item.set(
						'components',
						new NbtCompound().set(
							'minecraft:item_model',
							new NbtString(variantModel.item_model)
						)
					)
				} else if (!compareVersions('1.20.5', version) /* >= 1.20.5 */) {
					item.set(
						'components',
						new NbtCompound().set(
							'minecraft:custom_model_data',
							new NbtInt(variantModel.custom_model_data)
						)
					)
				} else if (!compareVersions('1.20.4', version) /* >= 1.20.4 */) {
					item.set(
						'tag',
						new NbtCompound().set(
							'CustomModelData',
							new NbtInt(variantModel.custom_model_data)
						)
					)
					// `Count` does not default to 1.
					// However, `count` does default to 1 in later versions, so we only need this for 1.20.4.
					item.set('Count', new NbtInt(1))
				}

				if (node.configs?.default) {
					DisplayEntityConfig.fromJSON(node.configs.default).toNBT(passenger)
				}
				break
			}
			case 'text_display': {
				passenger
					.set('id', new NbtString('minecraft:text_display'))
					.set('background', new NbtInt(TextComponent.hexToInt(node.background_color)))
					.set('line_width', new NbtInt(node.line_width))
					.set('shadow', new NbtByte(node.shadow ? 1 : 0))
					.set('see_through', new NbtByte(node.see_through ? 1 : 0))
					.set('alignment', new NbtString(node.align))

				if (!compareVersions('1.21.5', version) /* >= 1.21.5 */) {
					passenger.set(
						'text',
						// SNBT JSON text format
						// Hacky workaround for deepslate not supporting MC's new escape sequences.
						new NbtString(
							'$$$' + node.type + '_' + node.storage_name + '_text_placeholder$$$'
						)
					)
				} else if (!compareVersions('1.20.4', version) /* >= 1.20.4 */) {
					passenger.set(
						'text',
						// String JSON text format
						new NbtString(
							TextComponent.fromString(node.text, {
								minecraftVersion: version,
							}).toString(true, version)
						)
					)
				} else {
					throw new Error(`Unsupported Minecraft version '${version}' for text display!`)
				}

				if (node.configs?.default) {
					DisplayEntityConfig.fromJSON(node.configs.default).toNBT(passenger)
				}
				break
			}
			case 'item_display': {
				const item = new NbtCompound().set('id', new NbtString(node.item))
				passenger
					.set('id', new NbtString('minecraft:item_display'))
					.set('item', item)
					.set('item_display', new NbtString(node.item_display))

				if (!compareVersions(version, '1.20.4') /* <= 1.20.4 */) {
					// `Count` does not default to 1 in 1.20.4.
					item.set('Count', new NbtInt(1))
					break
				}

				if (node.configs?.default) {
					DisplayEntityConfig.fromJSON(node.configs.default).toNBT(passenger)
				}
				break
			}
			case 'block_display': {
				const states = new NbtCompound()
				const parsed = await parseBlock(node.block)
				if (!parsed) {
					throw new Error(
						`Invalid Blockstate '${node.block}' in node '${node.storage_name}'!`
					)
				}
				for (const [k, v] of Object.entries(parsed.states)) {
					states.set(k, new NbtString(v.toString()))
				}

				passenger
					.set('id', new NbtString('minecraft:block_display'))
					.set(
						'block_state',
						new NbtCompound()
							.set('Name', new NbtString(parsed.resource.name))
							.set('Properties', states)
					)

				if (node.configs?.default) {
					DisplayEntityConfig.fromJSON(node.configs.default).toNBT(passenger)
				}
				break
			}
			default: {
				// Skips nodes that are not actually riding the root entity.
				continue
			}
		}

		passengers.add(passenger)
	}

	let result = passengers.toString()

	if (!compareVersions('1.21.5', version) /* >= 1.21.5 */) {
		for (const display of Object.values(rig.nodes).filter(n => n.type === 'text_display')) {
			result = result.replace(
				'"$$$' + display.type + '_' + display.storage_name + '_text_placeholder$$$"',
				TextComponent.fromString(display.text, { minecraftVersion: version }).toString(
					true,
					version
				)
			)
		}
	}

	return result
}

async function createAnimationStorage(rig: IRenderedRig, animations: IRenderedAnimation[]) {
	PROGRESS_DESCRIPTION.set('Creating Animation Storage...')
	PROGRESS.set(0)
	MAX_PROGRESS.set(
		animations.length + animations.reduce((acc, anim) => acc + anim.frames.length, 0)
	)
	const dataCommands: string[] = []
	const limiter = new MSLimiter(16)

	for (const animation of animations) {
		PROGRESS_DESCRIPTION.set(`Creating Animation Storage for '${animation.storage_name}'`)
		let frames = new NbtCompound()
		const addFrameDataCommand = () => {
			const str = `data modify storage animated_java:${
				Project!.animated_java.blueprint_id
			}/animations ${animation.storage_name} merge value ${frames.toString()}`
			dataCommands.push(str)
			frames = new NbtCompound()
		}
		for (let i = 0; i < animation.frames.length; i++) {
			const frame = animation.frames[i]
			const thisFrame = new NbtCompound()
			frames.set(i.toString(), thisFrame)
			for (const [uuid, node] of Object.entries(animation.modified_nodes)) {
				if (node.type === 'struct') continue
				const transform = frame.node_transforms[uuid]
				if (!transform) {
					console.warn('No transform found for node:', node)
					continue
				}
				if (BONE_TYPES.includes(node.type)) {
					thisFrame.set(
						node.storage_name,
						new NbtCompound()
							.set('transformation', matrixToNbtFloatArray(transform.matrix))
							.set('start_interpolation', new NbtInt(0))
					)
				} else {
					thisFrame.set(
						node.storage_name,
						new NbtCompound()
							.set('px', new NbtFloat(roundTo(transform.pos[0], 4)))
							.set('py', new NbtFloat(roundTo(transform.pos[1], 4)))
							.set('pz', new NbtFloat(roundTo(transform.pos[2], 4)))
							.set('rx', new NbtFloat(roundTo(transform.rot[0], 4)))
							.set('ry', new NbtFloat(roundTo(transform.rot[1], 4)))
					)
				}
			}
			if (frame.variants?.length) {
				const uuid = frame.variants[0]
				thisFrame.set(
					'variant',
					new NbtCompound()
						.set('name', new NbtString(rig.variants[uuid].name))
						.set(
							'condition',
							new NbtString(
								frame.variants_execute_condition
									? `${frame.variants_execute_condition} `
									: ''
							)
						)
				)
			}
			if (frames.toString().length > 1000000) {
				addFrameDataCommand()
			}
			PROGRESS.set(PROGRESS.get() + 1)
			await limiter.sync()
		}
		addFrameDataCommand()
		PROGRESS.set(PROGRESS.get() + 1)
		await limiter.sync()
	}

	return dataCommands
}

function nodeSorter(a: AnyRenderedNode, b: AnyRenderedNode): number {
	if (a.type === 'locator' && b.type !== 'locator') return 1
	if (a.type !== 'locator' && b.type === 'locator') return -1
	return 0
}

interface DataPackCompilerOptions {
	ajmeta: AJMeta
	version: string
	coreFiles: Map<string, ExportedFile>
	versionedFiles: Map<string, ExportedFile>
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	rigHash: string
	animationHash: string
	debugMode: boolean
}

export type DataPackCompiler = (options: DataPackCompilerOptions) => Promise<void>

interface CompileDataPackOptions {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	dataPackFolder: string
	rigHash: string
	animationHash: string
	debugMode: boolean
}

export default async function compileDataPack(version: string, options: CompileDataPackOptions) {
	console.time('Data Pack Compilation took')

	const aj = Project!.animated_java

	const ajmeta = new AJMeta(
		PathModule.join(options.dataPackFolder, 'data.ajmeta'),
		aj.blueprint_id,
		Project!.last_used_blueprint_id,
		options.dataPackFolder
	)

	if (aj.data_pack_export_mode === 'folder') {
		ajmeta.read()
	}

	const globalCoreFiles = new Map<string, ExportedFile>()
	const globalVersionSpecificFiles = new Map<string, ExportedFile>()
	const coreDataPackFolder = options.dataPackFolder

	console.groupCollapsed(`Compiling data pack for Minecraft ${version}`)
	const coreFiles = new Map<string, ExportedFile>()
	const versionedFiles = new Map<string, ExportedFile>()

	await dataPackCompiler({
		...options,
		ajmeta,
		version,
		coreFiles,
		versionedFiles,
	})

	for (const [path, file] of coreFiles) {
		const relative = PathModule.join(coreDataPackFolder, path)
		globalCoreFiles.set(relative, file)
		if (file.includeInAJMeta === false) continue
		ajmeta.coreFiles.add(relative)
	}

	for (const [path, file] of versionedFiles) {
		const relative = PathModule.join(coreDataPackFolder, path)
		globalVersionSpecificFiles.set(relative, file)
		if (file.includeInAJMeta === false) continue
		ajmeta.versionedFiles.add(relative)
	}

	console.groupEnd()

	console.log('Exported Files:', globalCoreFiles.size + globalVersionSpecificFiles.size)

	const packMetaPath = PathModule.join(options.dataPackFolder, 'pack.mcmeta')
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

	packMeta.content.pack.description ??= `Animated Java Data Pack for ${version}`

	globalCoreFiles.set(PathModule.join(options.dataPackFolder, 'pack.mcmeta'), {
		content: autoStringify(packMeta.toJSON()),
		includeInAJMeta: false,
	})

	if (aj.data_pack_export_mode === 'folder') {
		await removeFiles(ajmeta)

		// Write new files
		ajmeta.coreFiles = new Set(globalCoreFiles.keys())
		ajmeta.versionedFiles = new Set(globalVersionSpecificFiles.keys())
		ajmeta.write()

		const exportedFiles = new Map<string, ExportedFile>([
			...globalCoreFiles,
			...globalVersionSpecificFiles,
		])

		console.time('Writing DataPack Files took')
		await writeFiles(exportedFiles, options.dataPackFolder)
		console.timeEnd('Writing DataPack Files took')
	} else if (aj.data_pack_export_mode === 'zip') {
		const data: AsyncZippable = {}

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

		await rm(options.dataPackFolder, { recursive: true, force: true })
		const zipped = await zip(data, {})
		await writeFile(options.dataPackFolder, zipped)
	}

	console.timeEnd('Data Pack Compilation took')
}

async function removeFiles(ajmeta: AJMeta) {
	console.time('Removing Files took')
	const aj = Project!.animated_java
	const { existsSync, promises } = getFsModule()
	const { rm, writeFile, mkdir, copyFile, unlink, readFile } = promises

	if (aj.data_pack_export_mode === 'folder') {
		PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(ajmeta.previousVersionedFiles.size)
		const removedFolders = new Set<string>()
		for (const file of ajmeta.previousVersionedFiles) {
			if (isFunctionTagPath(file) && existsSync(file)) {
				if (aj.blueprint_id !== Project!.last_used_blueprint_id) {
					const resourceLocation = parseDataPackPath(file)!.resourceLocation
					if (resourceLocation.startsWith(`${Project!.last_used_blueprint_id}/`)) {
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
				let content: FunctionTagJSON
				// Remove mentions of the export namespace from the file
				try {
					content = JSON.parse((await readFile(file)).toString())
				} catch (e) {
					if (e instanceof SyntaxError) {
						throw new IntentionalExportError(
							`Failed to parse function tag file: '${file}'. Please ensure that the file is valid JSON.`
						)
					}
					continue
				}
				content.values = content.values.filter(
					v =>
						typeof v === 'string' &&
						(!v.startsWith(`${aj.blueprint_id}/`) ||
							!v.startsWith(`${Project!.last_used_blueprint_id}/`))
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
				(await promises.readdir(folder)).length === 0
			) {
				await rm(folder, { recursive: true })
				removedFolders.add(folder)
				folder = PathModule.dirname(folder)
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}
	}
	console.timeEnd('Removing Files took')
}

const dataPackCompiler: DataPackCompiler = async ({
	// ajmeta,
	version,
	// coreFiles,
	versionedFiles,
	rig,
	animations,
	rigHash,
	animationHash,
	debugMode,
}) => {
	TextComponent.defaultMinecraftVersion = version

	const aj = Project!.animated_java

	const parsed = parseResourceLocation(aj.blueprint_id)
	const relativePathToSrc = parsed.path
		.split('/')
		.map(() => '..')
		.join('/')

	const variables = {
		relativePathToSrc,
		blueprint_id: aj.blueprint_id,
		interpolation_duration: aj.interpolation_duration,
		teleportation_duration: aj.teleportation_duration,
		display_item: aj.display_item,
		rig,
		animations,
		export_version: Math.random().toString().substring(2, 10),
		root_entity_passengers: await generateRootEntityPassengers(version, rig),
		TAGS,
		OBJECTIVES,
		TELLRAW,
		ENTITY_NAMES,
		on_summon_function: aj.on_summon_function,
		on_remove_function: aj.on_remove_function,
		on_pre_tick_function: aj.on_pre_tick_function,
		on_post_tick_function: aj.on_post_tick_function,
		matrixToNbtFloatArray,
		transformationToNbt,
		use_storage_for_animation: aj.use_storage_for_animation,
		animationStorage: aj.use_storage_for_animation
			? await createAnimationStorage(rig, animations)
			: null,
		rig_hash: rigHash,
		animation_hash: animationHash,
		boundingBox: aj.render_box,
		DisplayEntityConfig,
		roundTo,
		nodeSorter,
		getRotationFromQuaternion: eulerFromQuaternion,
		has_locators: Object.values(rig.nodes).filter(n => n.type === 'locator').length > 0,
		has_entity_locators:
			Object.values(rig.nodes).filter(n => n.type === 'locator' && n.config?.use_entity)
				.length > 0,
		has_ticking_locators:
			Object.values(rig.nodes).filter(n => n.type === 'locator' && n.config?.on_tick_function)
				.length > 0,
		has_cameras: Object.values(rig.nodes).filter(n => n.type === 'camera').length > 0,
		has_animations: animations.length > 0,
		getNodeTags,
		BONE_TYPES,
		project_storage: `${aj.blueprint_id}`,
		temp_storage: `animated_java:temp`,
		gu_storage: `animated_java:gu`,
		data_storage: `animated_java:data`,
		auto_update_rig_orientation: aj.auto_update_rig_orientation,
		debug_mode: debugMode,
		use_entity_stacking: aj.use_entity_stacking,
		root_entity_tags: getRootEntityTags().toString(),
	}

	const mcbFiles = getMCBFilesByVersion(version)

	await compileMcbProject({
		sourceFiles: {
			'src/global.mcbt': mcbFiles.globalTemplates,
			'src/animated_java.mcb': mcbFiles.global,
			[`src/${parsed.fullPath}.mcb`]:
				`import ${relativePathToSrc}/global.mcbt\n` + mcbFiles.main,
		},
		destPath: '.',
		variables,
		version,
		exportedFiles: versionedFiles,
	})
}

async function writeFiles(exportedFiles: Map<string, ExportedFile>, dataPackFolder: string) {
	PROGRESS_DESCRIPTION.set('Writing Data Pack...')
	PROGRESS.set(0)
	MAX_PROGRESS.set(exportedFiles.size)
	const aj = Project!.animated_java
	const lastNamespace = Project!.last_used_blueprint_id
	const createdFolderCache = new Set<string>()

	const functionTagQueue = new Map<string, ExportedFile>()

	const { existsSync, readdirSync, promises } = getFsModule()
	const { mkdir, readFile, writeFile } = promises

	async function customWriteFile(path: string, file: ExportedFile) {
		if (isFunctionTagPath(path) && existsSync(path)) {
			functionTagQueue.set(path, file)
			return
		}

		const folder = PathModule.dirname(path)
		if (!createdFolderCache.has(folder)) {
			await mkdir(folder, { recursive: true })
			createdFolderCache.add(folder)
		}
		if (file.writeHandler) {
			await file.writeHandler(path, file.content)
		} else {
			await writeFile(
				path,
				new Uint8Array(
					Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content)
				)
			)
		}
		PROGRESS.set(PROGRESS.get() + 1)
	}

	const maxWriteThreads = 8
	const writeQueue = new Map<string, Promise<void>>()
	for (const [path, data] of exportedFiles) {
		writeQueue.set(
			path,
			customWriteFile(path, data).finally(() => {
				writeQueue.delete(path)
			})
		)
		if (writeQueue.size >= maxWriteThreads) {
			await Promise.any(writeQueue.values())
		}
	}
	await Promise.all(writeQueue.values())

	PROGRESS_DESCRIPTION.set('Merging Function Tags...')
	MAX_PROGRESS.set(functionTagQueue.size)
	PROGRESS.set(0)
	for (const [path, file] of functionTagQueue.entries()) {
		const oldTag = DataPackTag.fromJSON(JSON.parse((await readFile(path)).toString()))
		const merged = oldTag.merge(DataPackTag.fromJSON(JSON.parse(file.content.toString())))

		merged.filter(entry => {
			const id = DataPackTag.getEntryId(entry)
			const isTag = id.startsWith('#')
			const location = parseResourceLocation(isTag ? id.substring(1) : id)

			// Remove last namespace entries if the namespace has changed
			if (aj.blueprint_id !== lastNamespace && location.namespace === lastNamespace)
				return false

			// Search for the entry in all data folders
			const functionFolderName = projectTargetVersionIsAtLeast('1.21')
				? 'function'
				: 'functions'
			const subPath = (isTag ? 'tags/' : '') + functionFolderName
			const extension = isTag ? '.json' : '.mcfunction'

			for (const folder of readdirSync(dataPackFolder)) {
				const fullPath = PathModule.join(
					dataPackFolder,
					folder,
					location.namespace,
					subPath,
					location.path + extension
				)

				if (existsSync(fullPath)) return true
			}

			console.warn(
				`Removed reference to ${
					isTag ? 'tag' : 'function'
				} '${id}' in '${path}' because it does not exist!`
			)
			// Remove the entry if it wasn't found
			return false
		})

		merged.sort()

		await writeFile(path, autoStringify(merged.toJSON()))
		PROGRESS.set(PROGRESS.get() + 1)
	}
}
