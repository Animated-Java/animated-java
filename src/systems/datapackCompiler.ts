import { Compiler, Parser, Tokenizer, SyncIo } from 'mc-build'
import { VariableMap } from 'mc-build/dist/mcl/Compiler'
import { isFunctionTagPath } from '../util/fileUtil'
import datapackTemplate from './animated_java.mcb'
import { IRenderedRig } from './rigRenderer'
import { IRenderedAnimation } from './animationRenderer'
import { Variant } from '../variants'
import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtList, NbtString, NbtTag } from 'deepslate'
import {
	arrayToNbtFloatArray,
	matrixToNbtFloatArray,
	replacePathPart,
	sortObjectKeys,
} from './util'
import { BoneConfig } from '../boneConfig'
import { IBlueprintVariantBoneConfigJSON } from '../blueprintFormat'
import { IFunctionTag, mergeTag, parseDataPackPath } from '../util/minecraftUtil'
import { JsonText } from '../util/jsonText'
import { MAX_PROGRESS, PROGRESS } from '../interface/exportProgressDialog'

namespace TAGS {
	export const NEW = () => 'aj.new'
	export const GLOBAL_RIG = () => 'aj.rig_entity'

	export const GLOBAL_ROOT = () => 'aj.rig_root'
	export const PROJECT_ROOT = (exportNamespace: string) => `aj.${exportNamespace}.root`

	export const OUTDATED_RIG_TEXT_DISPLAY = () => 'aj.outdated_rig_text_display'

	export const GLOBAL_BONE = () => 'aj.bone'
	export const GLOBAL_CAMERA = () => 'aj.camera'
	export const GLOBAL_LOCATOR = () => 'aj.locator'

	export const PROJECT_BONE = (exportNamespace: string) => `aj.${exportNamespace}.bone`
	export const PROJECT_CAMERA = (exportNamespace: string) => `aj.${exportNamespace}.camera`
	export const PROJECT_LOCATOR = (exportNamespace: string) => `aj.${exportNamespace}.locator`

	export const LOCAL_BONE = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}`
	export const LOCAL_CAMERA = (exportNamespace: string, cameraName: string) =>
		`aj.${exportNamespace}.camera.${cameraName}`
	export const LOCAL_LOCATOR = (exportNamespace: string, locatorName: string) =>
		`aj.${exportNamespace}.locator.${locatorName}`

	export const ANIMATION_PLAYING = (exportNamespace: string, animationName: string) =>
		`aj.${exportNamespace}.animation.${animationName}.playing`

	export const TWEENING = (exportNamespace: string, animationName: string) =>
		`aj.${exportNamespace}.animation.${animationName}.tween_playing`

	export const VARIANT_APPLIED = (exportNamespace: string, variantName: string) =>
		`aj.${exportNamespace}.variant.${variantName}.applied`
}

namespace OBJECTIVES {
	export const I = () => 'aj.i'
	export const ID = () => 'aj.id'
	export const FRAME = () => 'aj.frame'
	export const IS_RIG_LOADED = () => 'aj.is_rig_loaded'
	export const TWEEN_DURATION = () => 'aj.tween_duration'
}

// 🗡 🏹 🔱 🧪 ⚗ 🎣 🛡 🪓 ⛏ ☠ ☮ ☯ ♠ Ω ♤ ♣ ♧ ❤ ♥ ♡
// ♦ ♢ ★ ☆ ☄ ☽ ☀ ☁ ☂ ☃ ◎ ☺ ☻ ☹ ☜ ☞ ♪ ♩ ♫ ♬ ✂ ✉ ∞ ♂ ♀ ❤ ™ ®
// © ✘ ■ □ ▲ △ ▼ ▽ ◆ ◇ ○ ◎ ● Δ ʊ ღ ₪ ½ ⅓ ⅔ ¼ ¾ ⅛ ⅜ ⅝ ⅞ ∧ ∨ ∩
// ⊂ ⊃  ⊥ ∀ Ξ Γ ɐ ə ɘ ε β ɟ ɥ ɯ ɔ и  ɹ ʁ я ʌ ʍ λ ч ∞ Σ Π Ⓐ Ⓑ Ⓒ
// Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ ⓐ ⓑ ⓒ ⓓ ⓔ ⓕ ⓖ ⓗ ⓘ ⓙ ⓚ ⓛ ⓜ ⓝ ⓞ ⓟ ⓠ ⓡ ⓢ ⓣ ⓤ ⓥ ⓦ ⓧ ⓨ ⓩ
// ▓ □〓≡ ╝╚╔╗╬ ╓ ╩┌ ┐└ ┘ ↑ ↓ → ← ↔ ▀▐ ░ ▒▬ ♦ ◘
// → ✎ ❣ ✚ ✔ ✖ ▁ ▂ ▃ ▄ ▅ ▆ ▇ █ ⊻ ⊼ ⊽ ⋃ ⌀ ⌂

const TELLRAW_PREFIX = new JsonText([
	{ text: '[', color: 'gray' },
	{ text: 'AJ', color: 'aqua' },
	{ text: '] ' },
])

namespace TELLRAW {
	export const RIG_OUTDATED = (exportNamespace: string) =>
		new JsonText([
			'',
			TELLRAW_PREFIX,
			{ text: 'Error: ', color: 'red' },
			{ text: 'The ', color: 'red' },
			{ text: exportNamespace, color: 'yellow' },
			{ text: ' rig instance at', color: 'red' },
			[
				{ text: ' [', color: 'yellow' },
				{ score: { name: '#this.x', objective: OBJECTIVES.I() } },
				', ',
				{ score: { name: '#this.y', objective: OBJECTIVES.I() } },
				', ',
				{ score: { name: '#this.z', objective: OBJECTIVES.I() } },
				']',
			],
			{
				text: ' is outdated! It will not function correctly and should be removed or re-summoned.',
				color: 'red',
			},
			'\n ',
			{
				text: '[Click Here to Teleport to the Rig Instance]',
				clickEvent: {
					action: 'suggest_command',
					value: '/tp @s $(x) $(y) $(z)',
				},
				color: 'aqua',
				underlined: true,
			},
		])
	export const RIG_OUTDATED_TEXT_DISPLAY = () =>
		new JsonText([
			'',
			{
				text: 'This rig instance is outdated!\\nIt will not function correctly and should be removed or re-summoned.',
				color: 'red',
			},
		])
	export const FUNCTION_NOT_EXECUTED_AS_ROOT_ERROR = (functionName: string, rootTag: string) =>
		new JsonText([
			'',
			TELLRAW_PREFIX,
			{ text: 'Error: ', color: 'red' },
			{ text: 'The function ', color: 'red' },
			{ text: functionName, color: 'yellow' },
			{ text: ' must be executed as the root entity.', color: 'red' },
			{ text: '\n You can use ', color: 'red' },
			{ text: `execute as @e[tag=${rootTag}] run ...`, color: 'aqua' },
			{ text: ' to run the function as the root.', color: 'red' },
		])
	// Summon Function
	export const VARIANT_CANNOT_BE_EMPTY = () =>
		new JsonText([
			'',
			TELLRAW_PREFIX,
			{ text: 'Error: ', color: 'red' },
			{ text: 'variant', color: 'yellow' },
			{ text: ' cannot be an empty string.', color: 'red' },
		])
	export const INVALID_VARIANT = (variantName: string, variants: Variant[]) =>
		new JsonText([
			'',
			TELLRAW_PREFIX,
			{ text: 'Error: ', color: 'red' },
			{ text: 'The variant ', color: 'red' },
			{ text: variantName, color: 'yellow' },
			{ text: ' does not exist.', color: 'red' },
			'\n ',
			{ text: ' ≡ ', color: 'white' },
			{ text: 'Available Variants:', color: 'green' },
			...variants.map(
				variant =>
					new JsonText([
						'\n ',
						' ',
						' ',
						{ text: ' ● ', color: 'gray' },
						{ text: variant.name, color: 'yellow' },
					])
			),
		])
	export const ANIMATION_CANNOT_BE_EMPTY = () =>
		new JsonText([
			'',
			TELLRAW_PREFIX,
			{ text: 'Error: ', color: 'red' },
			{ text: 'animation', color: 'yellow' },
			{ text: ' cannot be an empty string.', color: 'red' },
		])
	export const FRAME_CANNOT_BE_NEGATIVE = () =>
		new JsonText([
			'',
			TELLRAW_PREFIX,
			{ text: 'Error: ', color: 'red' },
			{ text: 'frame', color: 'yellow' },
			{ text: ' must be a non-negative integer.', color: 'red' },
		])
	export const INVALID_ANIMATION = (animationName: string, animations: IRenderedAnimation[]) =>
		new JsonText([
			'',
			TELLRAW_PREFIX,
			{ text: 'Error: ', color: 'red' },
			{ text: 'The animation ', color: 'red' },
			{ text: animationName, color: 'yellow' },
			{ text: ' does not exist.', color: 'red' },
			'\n ',
			{ text: ' ≡ ', color: 'white' },
			{ text: 'Available Animations:', color: 'green' },
			...animations.map(
				anim =>
					new JsonText([
						'\n ',
						' ',
						' ',
						{ text: ' ● ', color: 'gray' },
						{ text: anim.name, color: 'yellow' },
					])
			),
		])
}

function applyBoneConfigToNbtCompound(
	passenger: NbtCompound,
	config: IBlueprintVariantBoneConfigJSON,
	useComponents: boolean
) {
	const item = passenger.get('item') as NbtCompound
	const defaultConfig = new BoneConfig()

	if (config.billboard !== defaultConfig.billboard) {
		passenger.set('billboard', new NbtString(config.billboard))
	}

	if (config.brightness_override !== defaultConfig.brightnessOverride) {
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
		passenger.set('Glowing', new NbtByte(1))
	}

	if (config.glow_color !== defaultConfig.glowColor) {
		passenger.set(
			'glow_color_override',
			new NbtInt(Number(config.glow_color.replace('#', '0x')))
		)
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
	for (const node of Object.values(rig.nodeMap)) {
		const passenger = new NbtCompound()
		// TODO Maybe add components setting to blueprint settings?
		const useComponents = true

		passenger.set('id', new NbtString('minecraft:item_display'))

		const tags = new NbtList([new NbtString(TAGS.GLOBAL_RIG())])
		passenger.set('Tags', tags)

		if (node.type === 'bone') {
			tags.add(new NbtString(TAGS.GLOBAL_BONE()))
			tags.add(new NbtString(TAGS.PROJECT_BONE(aj.export_namespace)))
			tags.add(new NbtString(TAGS.LOCAL_BONE(aj.export_namespace, node.name)))
			passenger.set(
				'transformation',
				new NbtCompound()
					.set('translation', arrayToNbtFloatArray([0, 0, 0]))
					.set('left_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
					.set('right_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
					.set('scale', arrayToNbtFloatArray([0, 0, 0]))
			)
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

			applyBoneConfigToNbtCompound(passenger, node.configs.default, useComponents)

			passenger.set('height', new NbtFloat(aj.bounding_box[1]))
			passenger.set('width', new NbtFloat(aj.bounding_box[0]))
		} else if (node.type === 'camera') {
			tags.add(new NbtString(TAGS.GLOBAL_CAMERA()))
			tags.add(new NbtString(TAGS.PROJECT_CAMERA(aj.export_namespace)))
			tags.add(new NbtString(TAGS.LOCAL_CAMERA(aj.export_namespace, node.name)))
		} else if (node.type === 'locator') {
			tags.add(new NbtString(TAGS.GLOBAL_LOCATOR()))
			tags.add(new NbtString(TAGS.PROJECT_LOCATOR(aj.export_namespace)))
			tags.add(new NbtString(TAGS.LOCAL_LOCATOR(aj.export_namespace, node.name)))
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
		public lastUsedExportNamespace: string,
		public dataPackFolder: string
	) {}

	read() {
		if (!fs.existsSync(this.path)) return
		this.oldContent = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
		const data = this.oldContent[this.exportNamespace]
		const lastData = this.oldContent[this.lastUsedExportNamespace]
		if (lastData) {
			for (const file of lastData.datapack.files) {
				this.oldDatapack.files.add(PathModule.join(this.dataPackFolder, file))
			}
			delete this.oldContent[this.lastUsedExportNamespace]
		}
		if (data) {
			for (const file of data.datapack.files) {
				this.oldDatapack.files.add(PathModule.join(this.dataPackFolder, file))
			}
			delete this.oldContent[this.exportNamespace]
		}
	}

	write() {
		const folder = PathModule.dirname(this.path)
		const content: AJMeta['oldContent'] = {
			...this.oldContent,
			[this.exportNamespace]: {
				datapack: {
					files: Array.from(this.datapack.files).map(v =>
						PathModule.relative(folder, v).replace(/\\/g, '/')
					),
				},
			},
		}
		fs.writeFileSync(this.path, autoStringify(sortObjectKeys(content)))
	}
}

function createAnimationStorage(animations: IRenderedAnimation[]) {
	const storage: NbtCompound = new NbtCompound()
	for (const animation of animations) {
		const frames = new NbtList([
			new NbtCompound(), // This compound is just to make the list 1-indexed
		])
		const animStorage = new NbtCompound().set('frames', frames)
		storage.set(animation.name, animStorage)
		for (const frame of animation.frames) {
			const frameStorage = new NbtCompound()
			frames.add(frameStorage)
			for (const node of frame.nodes) {
				if (node.type !== 'bone') continue
				frameStorage.set(
					node.name,
					new NbtCompound()
						.set('transformation', matrixToNbtFloatArray(node.matrix))
						.set('start_interpolation', new NbtInt(0))
				)
			}
		}
	}
	return storage
}

export async function compileDataPack(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	dataPackFolder: string
	rigHash: string
	animationHash: string
}) {
	console.time('Data Pack Compilation took')
	const { rig, animations, rigHash, animationHash } = options
	const aj = Project!.animated_java
	console.log('Compiling Data Pack...', options)
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
		PathModule.join(options.dataPackFolder, '.ajmeta'),
		aj.export_namespace,
		Project!.last_used_export_namespace,
		options.dataPackFolder
	)
	ajmeta.read()

	const removedFolders = new Set<string>()
	for (const file of ajmeta.oldDatapack.files) {
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
				console.log('Moving old function tag:', file)
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
		}
	}

	const exportedFiles = new Map<string, string>()
	function createSyncIO(): SyncIo {
		const io = new SyncIo()
		io.write = (localPath, content) => {
			const writePath = PathModule.join(options.dataPackFolder, localPath)
			exportedFiles.set(writePath, content)
			ajmeta.datapack.files.add(writePath)
		}
		return io
	}

	compiler.io = createSyncIO()
	compiler.disableRequire = true
	compiler.templateParsingEnabled = false

	const variables = {
		export_namespace: aj.export_namespace,
		interpolation_duration: aj.interpolation_duration,
		teleportation_duration: aj.teleportation_duration,
		display_item: aj.display_item,
		rig,
		animations,
		variants: Variant.all,
		export_version: Math.random().toString().substring(2, 10),
		root_entity_passengers: generateRootEntityPassengers(rig),
		TAGS,
		OBJECTIVES,
		TELLRAW,
		custom_summon_commands: aj.summon_commands,
		matrixToNbtFloatArray,
		use_storage_for_animation: aj.use_storage_for_animation,
		animationStorage: createAnimationStorage(animations),
		rigHash,
		animationHash,
		boundingBox: aj.bounding_box,
		BoneConfig,
	}
	console.log('Compiler Variables:', variables)

	console.time('MC-Build Compiler took')
	const tokens = Tokenizer.tokenize(datapackTemplate, 'src/animated_java.mcb')
	compiler.addFile('src/animated_java.mcb', Parser.parseMcbFile(tokens))
	compiler.compile(VariableMap.fromObject(variables))
	console.timeEnd('MC-Build Compiler took')

	console.time('Writing Files took')
	await writeFiles(exportedFiles)
	console.timeEnd('Writing Files took')

	ajmeta.write()
	console.timeEnd('Data Pack Compilation took')
}

async function writeFiles(map: Map<string, string>) {
	PROGRESS.set(0)
	MAX_PROGRESS.set(map.size)
	const aj = Project!.animated_java
	const folderCache = new Set<string>()

	async function writeFile(path: string, content: string) {
		if (isFunctionTagPath(path) && fs.existsSync(path)) {
			const oldFile: IFunctionTag = JSON.parse(fs.readFileSync(path, 'utf-8'))
			const newFile: IFunctionTag = JSON.parse(content)
			const merged = mergeTag(oldFile, newFile)
			if (aj.export_namespace !== Project!.last_used_export_namespace) {
				merged.values = merged.values.filter(v => {
					const value = typeof v === 'string' ? v : v.id
					return (
						!value.startsWith(
							`#animated_java:${Project!.last_used_export_namespace}/`
						) ||
						value.startsWith(`animated_java:${Project!.last_used_export_namespace}/`)
					)
				})
			}
			content = JSON.stringify(merged)
		}

		const folderPath = PathModule.dirname(path)
		if (!folderCache.has(folderPath)) {
			await fs.promises.mkdir(folderPath, { recursive: true })
			folderCache.add(folderPath)
		}
		await fs.promises.writeFile(path, content)
		PROGRESS.set(PROGRESS.get() + 1)
		// console.log(PROGRESS.get())
		// await new Promise<void>(resolve => setTimeout(resolve, 100))
	}

	const maxWriteThreads = 8
	const writeQueue = new Map<string, Promise<void>>()
	for (const [path, content] of map) {
		writeQueue.set(
			path,
			writeFile(path, content).finally(() => {
				writeQueue.delete(path)
			})
		)
		if (writeQueue.size >= maxWriteThreads) {
			await Promise.any(writeQueue)
		}
	}
	await Promise.all(writeQueue.values())
}
