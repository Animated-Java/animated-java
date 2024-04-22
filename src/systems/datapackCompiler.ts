import { Compiler, Parser, Tokenizer, SyncIo } from 'mc-build'
import { VariableMap } from 'mc-build/dist/mcl/Compiler'
import { isFunctionTagPath } from '../util/fileUtil'
import datapackTemplate from './datapackCompiler/animated_java.mcb'
import { IRenderedNodes, IRenderedRig } from './rigRenderer'
import { IRenderedAnimation } from './animationRenderer'
import { Variant } from '../variants'
import { NbtCompound, NbtFloat, NbtInt, NbtList, NbtString, NbtTag } from 'deepslate'
import { matrixToNbtFloatArray, replacePathPart, sortObjectKeys } from './util'
import { BoneConfig } from '../boneConfig'
import { IBlueprintVariantBoneConfigJSON } from '../blueprintFormat'
import { IFunctionTag, mergeTag, parseDataPackPath } from '../util/minecraftUtil'

namespace TAGS {
	export const NEW = () => 'aj.new'
	export const GLOBAL_RIG_ENTITY = () => 'aj.rig_entity'

	export const GLOBAL_ROOT = () => 'aj.rig_root'
	export const PROJECT_ROOT = (exportNamespace: string) => `aj.${exportNamespace}.root`

	export const GLOBAL_BONE_ENTITY = () => 'aj.bone'
	export const GLOBAL_CAMERA_ENTITY = () => 'aj.camera'
	export const GLOBAL_LOCATOR_ENTITY = () => 'aj.locator'

	export const PROJECT_BONE_ENTITY = (exportNamespace: string) => `aj.${exportNamespace}.bone`
	export const PROJECT_CAMERA_ENTITY = (exportNamespace: string) => `aj.${exportNamespace}.camera`
	export const PROJECT_LOCATOR_ENTITY = (exportNamespace: string) =>
		`aj.${exportNamespace}.locator`

	export const LOCAL_BONE_ENTITY = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}`
	export const LOCAL_CAMERA_ENTITY = (exportNamespace: string, cameraName: string) =>
		`aj.${exportNamespace}.camera.${cameraName}`
	export const LOCAL_LOCATOR_ENTITY = (exportNamespace: string, locatorName: string) =>
		`aj.${exportNamespace}.locator.${locatorName}`

	export const ANIMATION_PLAYING = (exportNamespace: string, animationName: string) =>
		`aj.${exportNamespace}.animation.${animationName}.playing`
	export const TWEEN_PLAYING = (exportNamespace: string, animationName: string) =>
		`aj.${exportNamespace}.animation.${animationName}.tween_playing`
}

namespace OBJECTIVES {
	export const I = () => 'aj.i'
	export const ID = () => 'aj.id'
	export const FRAME = () => 'aj.frame'
	export const IS_RIG_LOADED = () => 'aj.is_rig_loaded'
}

function applyBoneConfigToPassenger(
	passenger: NbtCompound,
	config: IBlueprintVariantBoneConfigJSON,
	bone: IRenderedNodes['Bone'],
	useComponents: boolean
) {
	const item = passenger.get('item') as NbtCompound
	const defaultConfig = new BoneConfig()

	if (config.billboard !== defaultConfig.billboard) {
		passenger.set('billboard', new NbtString(config.billboard))
	}

	if (bone.configs.default.brightness_override !== defaultConfig.brightnessOverride) {
		passenger.set(
			'brightness',
			new NbtCompound()
				.set('block', new NbtFloat(config.brightness_override))
				.set('sky', new NbtFloat(config.brightness_override))
		)
	}

	if (config.enchanted !== defaultConfig.enchanted) {
		const components = item.get(useComponents ? 'components' : 'tag') as NbtCompound
		if (useComponents) {
			components.set(
				'minecraft:enchantments',
				new NbtCompound().set(
					'levels',
					new NbtCompound().set('minecraft:infinity', new NbtInt(1))
				)
			)
		} else {
			components.set('Enchantments', new NbtList([]))
		}
	}

	if (config.glowing !== defaultConfig.glowing) {
		passenger.set('glow_color_override', new NbtString(config.glow_color))
	}

	// TODO Figure out a good solution for toggling a bone's visibility...
	// if (config.invisible !== defaultConfig.invisible) {
	// 	passenger.set('invisible', new NbtByte(1))
	// }

	if (config.shadow_radius !== defaultConfig.shadowRadius) {
		passenger.set('shadow_radius', new NbtFloat(config.shadow_radius))
	}

	if (config.shadow_strength !== defaultConfig.shadowStrength) {
		passenger.set('shadow_strength', new NbtFloat(config.shadow_strength))
	}

	if (config.use_nbt !== defaultConfig.useNBT) {
		const newData = NbtTag.fromString(config.nbt) as NbtCompound
		for (const key of newData.keys()) {
			passenger.set(key, newData.get(key)!)
		}
	}
}

function generateRootEntityPassengers(rig: IRenderedRig) {
	const aj = Project!.animated_java
	const passengers: NbtList = new NbtList()
	for (const [nodeUuid, node] of Object.entries(rig.nodeMap)) {
		const passenger = new NbtCompound()
		const defaultPos = rig.defaultPose.find(pose => pose.uuid === nodeUuid)
		// TODO Add components setting to blueprint settings.
		const useComponents = true

		passenger.set('id', new NbtString('minecraft:item_display'))

		const tags = new NbtList([
			new NbtString(TAGS.NEW()),
			new NbtString(TAGS.GLOBAL_RIG_ENTITY()),
		])
		passenger.set('Tags', tags)

		if (node.type === 'bone') {
			tags.add(new NbtString(TAGS.GLOBAL_BONE_ENTITY()))
			tags.add(new NbtString(TAGS.PROJECT_BONE_ENTITY(aj.export_namespace)))
			tags.add(new NbtString(TAGS.LOCAL_BONE_ENTITY(aj.export_namespace, node.name)))
			passenger.set('transformation', matrixToNbtFloatArray(defaultPos!.matrix))
			passenger.set('interpolation_duration', new NbtInt(aj.interpolation_duration))
			passenger.set('teleport_duration', new NbtInt(aj.teleportation_duration))
			passenger.set('item_display', new NbtString('head'))
			const item = new NbtCompound()
			passenger.set(
				'item',
				item
					.set('id', new NbtString(aj.display_item))
					.set(useComponents ? 'count' : 'Count', new NbtInt(1))
					.set(
						useComponents ? 'components' : 'tag',
						new NbtCompound().set(
							useComponents ? 'minecraft:custom_model_data' : 'CustomModelData',
							new NbtInt(node.customModelData)
						)
					)
			)

			applyBoneConfigToPassenger(passenger, node.configs.default, node, useComponents)

			// TODO Add bone bounding box adjustment
			passenger.set('height', new NbtFloat(100))
			passenger.set('width', new NbtFloat(100))
		} else if (node.type === 'camera') {
			tags.add(new NbtString(TAGS.GLOBAL_CAMERA_ENTITY()))
			tags.add(new NbtString(TAGS.PROJECT_CAMERA_ENTITY(aj.export_namespace)))
			tags.add(new NbtString(TAGS.LOCAL_CAMERA_ENTITY(aj.export_namespace, node.name)))
		} else if (node.type === 'locator') {
			tags.add(new NbtString(TAGS.GLOBAL_LOCATOR_ENTITY()))
			tags.add(new NbtString(TAGS.PROJECT_LOCATOR_ENTITY(aj.export_namespace)))
			tags.add(new NbtString(TAGS.LOCAL_LOCATOR_ENTITY(aj.export_namespace, node.name)))
		}

		passengers.add(passenger)
	}

	return passengers.toString()
}

class AJMeta {
	public datapack = {
		files: new Set<string>(),
	}
	public oldDatapack = {
		files: new Set<string>(),
	}
	private oldContent: Record<string, { datapack: { files: string[] } }> = {}

	constructor(
		public path: string,
		public exportNamespace: string,
		public lastUsedExportNamespace: string
	) {}

	read() {
		if (!fs.existsSync(this.path)) return
		this.oldContent = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
		const data = this.oldContent[this.exportNamespace]
		const lastData = this.oldContent[this.lastUsedExportNamespace]
		if (lastData) {
			for (const file of lastData.datapack.files) {
				this.oldDatapack.files.add(file)
			}
			delete this.oldContent[this.lastUsedExportNamespace]
		}
		if (data) {
			for (const file of data.datapack.files) {
				this.oldDatapack.files.add(file)
			}
			delete this.oldContent[this.exportNamespace]
		}
	}

	write() {
		const content: AJMeta['oldContent'] = {
			...this.oldContent,
			[this.exportNamespace]: {
				datapack: {
					files: Array.from(this.datapack.files),
				},
			},
		}
		fs.writeFileSync(this.path, autoStringify(sortObjectKeys(content)))
	}
}

export function compileDataPack(options: { rig: IRenderedRig; animations: IRenderedAnimation[] }) {
	console.time('Data Pack Compilation took')
	const { rig, animations } = options
	const aj = Project!.animated_java
	console.log('Compiling Data Pack...')
	const compiler = new Compiler('src/', {
		libDir: null,
		generatedDirName: 'zzz',
		internalScoreboardName: 'aj.i',
		eqVarScoreboardName: null,
		eqConstScoreboardName: null,
		header: '# This file was generated by Animated Java via MC-Build. It is not recommended to edit this file directly.',
		ioThreadCount: null,
		setup: null,
	})

	const ajmeta = new AJMeta(
		PathModule.join(Project!.animated_java.data_pack, '.ajmeta'),
		aj.export_namespace,
		Project!.last_used_export_namespace
	)
	ajmeta.read()

	const removedFolders = new Set<string>()
	for (const file of ajmeta.oldDatapack.files) {
		if (!isFunctionTagPath(file)) {
			if (fs.existsSync(file)) fs.unlinkSync(file)
		} else if (aj.export_namespace !== Project!.last_used_export_namespace) {
			const resourceLocation = parseDataPackPath(file)!.resourceLocation
			if (
				resourceLocation.startsWith(
					`animated_java:${Project!.last_used_export_namespace}/`
				) &&
				fs.existsSync(file)
			) {
				console.log('Moving old function tag:', file)
				const newPath = replacePathPart(
					file,
					Project!.last_used_export_namespace,
					aj.export_namespace
				)
				fs.mkdirSync(PathModule.dirname(newPath), { recursive: true })
				fs.copyFileSync(file, newPath)
				fs.unlinkSync(file)
			}
		}
		let folder = PathModule.dirname(file)
		while (
			!removedFolders.has(folder) &&
			fs.existsSync(folder) &&
			fs.readdirSync(folder).length === 0
		) {
			fs.rmSync(folder, { recursive: true })
			removedFolders.add(folder)
			folder = PathModule.dirname(folder)
		}
	}

	function createSyncIO(): SyncIo {
		const io = new SyncIo()
		const folderCache = new Set<string>()

		io.write = (localPath, content) => {
			const writePath = PathModule.join(Project!.animated_java.data_pack, localPath)

			if (isFunctionTagPath(writePath) && fs.existsSync(writePath)) {
				const oldFile: IFunctionTag = JSON.parse(fs.readFileSync(writePath, 'utf-8'))
				const newFile: IFunctionTag = JSON.parse(content)
				const merged = mergeTag(oldFile, newFile)
				if (aj.export_namespace !== Project!.last_used_export_namespace) {
					merged.values = merged.values.filter(v => {
						const value = typeof v === 'string' ? v : v.id
						return (
							!value.startsWith(
								`#animated_java:${Project!.last_used_export_namespace}/`
							) ||
							value.startsWith(
								`animated_java:${Project!.last_used_export_namespace}/`
							)
						)
					})
				}
				content = JSON.stringify(merged)
			}

			const folderPath = PathModule.dirname(writePath)
			if (!folderCache.has(folderPath)) {
				fs.mkdirSync(folderPath, { recursive: true })
				folderCache.add(folderPath)
			}
			fs.writeFileSync(writePath, content)
			ajmeta.datapack.files.add(writePath)
		}

		return io
	}

	compiler.io = createSyncIO()
	compiler.disableRequire = true

	const variables = {
		export_namespace: aj.export_namespace,
		interpolation_duration: aj.interpolation_duration,
		teleportation_duration: aj.teleportation_duration,
		rig,
		animations,
		variants: Variant.all,
		export_version: Math.random().toString().substring(2, 10),
		root_entity_passengers: generateRootEntityPassengers(rig),
		TAGS,
		OBJECTIVES,
		custom_summon_commands: aj.summon_commands,
		matrixToNbtFloatArray,
	}

	console.time('MC-Build Compiler took')
	const tokens = Tokenizer.tokenize(datapackTemplate, 'src/animated_java.mcb')
	compiler.addFile('src/animated_java.mcb', Parser.parseMcbFile(tokens))
	compiler.compile(VariableMap.fromObject(variables))
	console.timeEnd('MC-Build Compiler took')

	ajmeta.write()
	console.timeEnd('Data Pack Compilation took')
}
