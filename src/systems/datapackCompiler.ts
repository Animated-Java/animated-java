import { Compiler, Parser, Tokenizer, SyncIo } from 'mc-build'
import { VariableMap } from 'mc-build/dist/mcl/Compiler'
import { isFunctionTagPath } from '../util/fileUtil'
import animationMcb from './datapackCompiler/animation.mcb'
import { AnyRenderedNode, IRenderedRig, IRenderedVariant } from './rigRenderer'
import { IRenderedAnimation } from './animationRenderer'
import { Variant } from '../variants'
import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtList, NbtString } from 'deepslate/lib/nbt'
import {
	arrayToNbtFloatArray,
	matrixToNbtFloatArray,
	replacePathPart,
	sortObjectKeys,
	transformationToNbt,
	zip,
} from './util'
import { BoneConfig, TextDisplayConfig } from '../nodeConfigs'
import {
	IFunctionTag,
	mergeTag,
	parseBlock,
	parseDataPackPath,
	parseResourceLocation,
} from '../util/minecraftUtil'
import { JsonText } from './minecraft/jsonText'
import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../interface/exportProgressDialog'
import { eulerFromQuaternion, floatToHex, roundTo, tinycolorToDecimal } from '../util/misc'
import { setTimeout } from 'timers'
import { MSLimiter } from '../util/msLimiter'

const BONE_TYPES = ['bone', 'text_display', 'item_display', 'block_display']

namespace TAGS {
	export const NEW = () => 'aj.new'
	export const GLOBAL_RIG = () => 'aj.rig_entity'
	// Used to tell the set and apply frame functions to only apply the bone transforms, and ignore command/variant keyframes
	export const TRANSFORMS_ONLY = () => 'aj.transforms_only'

	export const GLOBAL_ROOT = () => 'aj.rig_root'
	export const PROJECT_ROOT = (exportNamespace: string) => `aj.${exportNamespace}.root`

	export const OUTDATED_RIG_TEXT_DISPLAY = () => 'aj.outdated_rig_text_display'

	export const GLOBAL_BONE = () => 'aj.bone'
	export const GLOBAL_CAMERA = () => 'aj.camera'
	export const GLOBAL_LOCATOR = () => 'aj.locator'
	export const GLOBAL_DATA = () => 'aj.data'

	export const PROJECT_BONE = (exportNamespace: string) => `aj.${exportNamespace}.bone`
	export const PROJECT_CAMERA = (exportNamespace: string) => `aj.${exportNamespace}.camera`
	export const PROJECT_LOCATOR = (exportNamespace: string) => `aj.${exportNamespace}.locator`
	export const PROJECT_DATA = (exportNamespace: string) => `aj.${exportNamespace}.data`

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
	export const FRAME = (animationName: string) => `aj.${animationName}.frame`
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
	export const INVALID_VARIANT = (
		variantName: string,
		variants: Record<string, IRenderedVariant>
	) =>
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
			...Object.values(variants).map(
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
						{ text: anim.safe_name, color: 'yellow' },
					])
			),
		])
}

async function generateRootEntityPassengers(rig: IRenderedRig, rigHash: string) {
	const aj = Project!.animated_java
	const passengers: NbtList = new NbtList()

	const { locators, cameras, bones } = createPassengerStorage(rig)

	passengers.add(
		new NbtCompound()
			.set('id', new NbtString('minecraft:marker'))
			.set(
				'Tags',
				new NbtList([
					new NbtString(TAGS.GLOBAL_RIG()),
					new NbtString(TAGS.GLOBAL_DATA()),
					new NbtString(TAGS.PROJECT_DATA(aj.export_namespace)),
				])
			)
			.set(
				'data',
				new NbtCompound()
					.set('rigHash', new NbtString(rigHash))
					.set('locators', locators)
					.set('cameras', cameras)
					.set('bones', bones)
			)
	)

	for (const [uuid, node] of Object.entries(rig.nodes)) {
		const passenger = new NbtCompound()
		// TODO Maybe add components setting to blueprint settings?
		const useComponents = true

		const tags = new NbtList([new NbtString(TAGS.GLOBAL_RIG())])
		passenger.set('Tags', tags)

		switch (node.type) {
			case 'bone': {
				passenger.set('id', new NbtString('minecraft:item_display'))
				tags.add(new NbtString(TAGS.GLOBAL_BONE()))
				tags.add(new NbtString(TAGS.PROJECT_BONE(aj.export_namespace)))
				tags.add(new NbtString(TAGS.LOCAL_BONE(aj.export_namespace, node.safe_name)))
				passenger.set(
					'transformation',
					new NbtCompound()
						.set('translation', arrayToNbtFloatArray([0, 0, 0]))
						.set('left_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
						.set('right_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
						.set('scale', arrayToNbtFloatArray([0, 0, 0]))
				)
				passenger.set('interpolation_duration', new NbtInt(aj.interpolation_duration))
				passenger.set('teleport_duration', new NbtInt(0))
				passenger.set('item_display', new NbtString('head'))
				const item = new NbtCompound()
				const variantModel = rig.variants[Variant.getDefault().uuid].models[uuid]
				if (!variantModel) {
					throw new Error(`Model for bone '${node.safe_name}' not found!`)
				}
				passenger.set(
					'item',
					item
						.set('id', new NbtString(aj.display_item))
						.set(useComponents ? 'count' : 'Count', new NbtInt(1))
						.set(
							useComponents ? 'components' : 'tag',
							new NbtCompound().set(
								useComponents ? 'minecraft:custom_model_data' : 'CustomModelData',
								new NbtInt(variantModel.custom_model_data)
							)
						)
				)

				if (node.configs.default) {
					BoneConfig.fromJSON(node.configs.default).toNBT(passenger)
				}

				passenger.set('height', new NbtFloat(aj.bounding_box[1]))
				passenger.set('width', new NbtFloat(aj.bounding_box[0]))
				break
			}
			case 'text_display': {
				passenger.set('id', new NbtString('minecraft:text_display'))
				tags.add(new NbtString(TAGS.GLOBAL_BONE()))
				tags.add(new NbtString(TAGS.PROJECT_BONE(aj.export_namespace)))
				tags.add(new NbtString(TAGS.LOCAL_BONE(aj.export_namespace, node.safe_name)))
				passenger.set(
					'transformation',
					new NbtCompound()
						.set('translation', arrayToNbtFloatArray([0, 0, 0]))
						.set('left_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
						.set('right_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
						.set('scale', arrayToNbtFloatArray([0, 0, 0]))
				)
				passenger.set('interpolation_duration', new NbtInt(aj.interpolation_duration))
				passenger.set('teleport_duration', new NbtInt(0))

				passenger.set('height', new NbtFloat(aj.bounding_box[1]))
				passenger.set('width', new NbtFloat(aj.bounding_box[0]))

				passenger.set(
					'text',
					new NbtString(node.text ? node.text.toString() : '"Invalid Text Component"')
				)

				const color = new tinycolor(
					node.background_color + floatToHex(node.background_alpha)
				)
				passenger.set('background', new NbtInt(tinycolorToDecimal(color)))
				passenger.set('line_width', new NbtInt(node.line_width))
				passenger.set('shadow', new NbtByte(node.shadow ? 1 : 0))
				passenger.set('see_through', new NbtByte(node.see_through ? 1 : 0))

				if (node.config) {
					TextDisplayConfig.fromJSON(node.config).toNBT(passenger)
				}
				break
			}
			case 'item_display': {
				passenger.set('id', new NbtString('minecraft:item_display'))
				tags.add(new NbtString(TAGS.GLOBAL_BONE()))
				tags.add(new NbtString(TAGS.PROJECT_BONE(aj.export_namespace)))
				tags.add(new NbtString(TAGS.LOCAL_BONE(aj.export_namespace, node.safe_name)))
				passenger.set(
					'item',
					new NbtCompound()
						.set('id', new NbtString(node.item))
						.set('count', new NbtInt(1))
				)

				if (node.config) {
					BoneConfig.fromJSON(node.config).toNBT(passenger)
				}
				break
			}
			case 'block_display': {
				passenger.set('id', new NbtString('minecraft:block_display'))
				tags.add(new NbtString(TAGS.GLOBAL_BONE()))
				tags.add(new NbtString(TAGS.PROJECT_BONE(aj.export_namespace)))
				tags.add(new NbtString(TAGS.LOCAL_BONE(aj.export_namespace, node.safe_name)))

				const parsed = await parseBlock(node.block)
				if (!parsed) {
					throw new Error(
						`Invalid Blockstate '${node.block}' in node '${node.safe_name}'!`
					)
				}

				const states = new NbtCompound()
				for (const [k, v] of Object.entries(parsed.states)) {
					states.set(k, new NbtString(v.toString()))
				}

				passenger.set(
					'block_state',
					new NbtCompound()
						.set('Name', new NbtString(parsed.resource.name))
						.set('Properties', states)
				)

				if (node.config) {
					BoneConfig.fromJSON(node.config).toNBT(passenger)
				}
				break
			}
		}

		passengers.add(passenger)
	}

	return passengers.toString()
}

class DataPackAJMeta {
	public files = new Set<string>()
	public oldFiles = new Set<string>()
	private oldContent: Record<string, { files?: string[] }> = {}

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
			if (!Array.isArray(lastData.files)) lastData.files = []
			for (const file of lastData.files) {
				this.oldFiles.add(PathModule.join(this.dataPackFolder, file))
			}
			delete this.oldContent[this.lastUsedExportNamespace]
		}
		if (data) {
			if (!Array.isArray(data.files)) data.files = []
			for (const file of data.files) {
				this.oldFiles.add(PathModule.join(this.dataPackFolder, file))
			}
			delete this.oldContent[this.exportNamespace]
		}
	}

	write() {
		const folder = PathModule.dirname(this.path)
		const content: DataPackAJMeta['oldContent'] = {
			...this.oldContent,
			[this.exportNamespace]: {
				files: Array.from(this.files).map(v =>
					PathModule.relative(folder, v).replace(/\\/g, '/')
				),
			},
		}
		fs.writeFileSync(this.path, autoStringify(sortObjectKeys(content)))
	}
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
		PROGRESS_DESCRIPTION.set(`Creating Animation Storage for '${animation.safe_name}'`)
		let frames = new NbtCompound()
		const addFrameDataCommand = () => {
			const str = `data modify storage aj.${
				Project!.animated_java.export_namespace
			}:animations ${animation.safe_name} merge value ${frames.toString()}`
			dataCommands.push(str)
			frames = new NbtCompound()
		}
		for (let i = 0; i < animation.frames.length; i++) {
			const frame = animation.frames[i]
			const thisFrame = new NbtCompound()
			frames.set(i.toString(), thisFrame)
			for (const [uuid, node] of Object.entries(animation.modified_nodes)) {
				const transform = frame.node_transforms[uuid]
				if (BONE_TYPES.includes(node.type)) {
					thisFrame.set(
						node.type + '_' + node.safe_name,
						new NbtCompound()
							.set('transformation', matrixToNbtFloatArray(transform.matrix))
							.set('start_interpolation', new NbtInt(0))
					)
				} else {
					thisFrame.set(
						node.type + '_' + node.safe_name,
						new NbtCompound()
							.set('posx', new NbtFloat(transform.pos[0]))
							.set('posy', new NbtFloat(transform.pos[1]))
							.set('posz', new NbtFloat(transform.pos[2]))
							.set('rotx', new NbtFloat(transform.rot[0]))
							.set('roty', new NbtFloat(transform.rot[1]))
					)
				}
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

function createPassengerStorage(rig: IRenderedRig) {
	const bones = new NbtCompound()
	const locators = new NbtCompound()
	const cameras = new NbtCompound()
	// Data entity
	bones.set('data_data', new NbtString(''))
	for (const node of Object.values(rig.nodes)) {
		switch (node.type) {
			case 'locator':
			case 'camera': {
				const data = new NbtCompound()
					.set('posx', new NbtFloat(node.default_transform.pos[0]))
					.set('posy', new NbtFloat(node.default_transform.pos[1]))
					.set('posz', new NbtFloat(node.default_transform.pos[2]))
					.set('rotx', new NbtFloat(Math.radToDeg(node.default_transform.rot[0])))
					.set('roty', new NbtFloat(Math.radToDeg(node.default_transform.rot[1])))
				if (node.type === 'locator' && node.config?.use_entity)
					data.set('uuid', new NbtString(''))
				;(node.type === 'camera' ? cameras : locators).set(node.safe_name, data)
				break
			}
			case 'bone':
			case 'text_display':
			case 'item_display':
			case 'block_display': {
				bones.set(node.type + '_' + node.safe_name, new NbtString(''))
				break
			}
		}
	}
	return { locators, cameras, bones }
}

function nodeSorter(a: AnyRenderedNode, b: AnyRenderedNode): number {
	if (a.type === 'locator' && b.type !== 'locator') return 1
	if (a.type !== 'locator' && b.type === 'locator') return -1
	return 0
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
		dontEmitComments: true,
		setup: null,
		formatVersion: Infinity, // We are living in the future! 🤖
	})

	let ajmeta: DataPackAJMeta | null = null
	if (aj.data_pack_export_mode === 'raw') {
		ajmeta = new DataPackAJMeta(
			PathModule.join(options.dataPackFolder, 'data.ajmeta'),
			aj.export_namespace,
			Project!.last_used_export_namespace,
			options.dataPackFolder
		)
		ajmeta.read()

		PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(ajmeta.oldFiles.size)
		const removedFolders = new Set<string>()
		for (const file of ajmeta.oldFiles) {
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
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}
	}

	const exportedFiles = new Map<string, string>()
	function createSyncIO(): SyncIo {
		const io = new SyncIo()
		io.write = (localPath, content) => {
			const writePath = PathModule.join(options.dataPackFolder, localPath)
			exportedFiles.set(writePath, content)
			if (ajmeta) ajmeta.files.add(writePath)
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
		export_version: Math.random().toString().substring(2, 10),
		root_entity_passengers: await generateRootEntityPassengers(rig, rigHash),
		TAGS,
		OBJECTIVES,
		TELLRAW,
		custom_summon_commands: aj.summon_commands,
		matrixToNbtFloatArray,
		transformationToNbt,
		use_storage_for_animation: aj.use_storage_for_animation,
		animationStorage: aj.use_storage_for_animation
			? await createAnimationStorage(rig, animations)
			: null,
		rigHash,
		animationHash,
		boundingBox: aj.bounding_box,
		BoneConfig,
		roundTo,
		nodeSorter,
		getRotationFromQuaternion: eulerFromQuaternion,
		root_ticking_commands: aj.ticking_commands,
	}
	console.log('Compiler Variables:', variables)

	PROGRESS_DESCRIPTION.set('Compiling Data Pack...')
	PROGRESS.set(0)
	await new Promise(resolve => setTimeout(resolve, 2000 / framespersecond))
	console.time('MC-Build Compiler took')
	const tokens = Tokenizer.tokenize(animationMcb, 'src/animated_java.mcb')
	compiler.addFile('src/animated_java.mcb', Parser.parseMcbFile(tokens))
	compiler.compile(VariableMap.fromObject(variables))
	console.timeEnd('MC-Build Compiler took')

	PROGRESS_DESCRIPTION.set('Writing Data Pack...')
	if (aj.data_pack_export_mode === 'raw') {
		console.time('Writing Files took')
		await writeFiles(exportedFiles, options.dataPackFolder)
		console.timeEnd('Writing Files took')
		ajmeta!.write()
	} else if (aj.data_pack_export_mode === 'zip') {
		exportedFiles.set(
			PathModule.join(options.dataPackFolder, 'pack.mcmeta'),
			autoStringify({
				pack: {
					// FIXME - This number should be a config option.
					pack_format: 48,
					description: `${Project!.name}. Generated with Animated Java`,
				},
			})
		)

		const exportPath =
			options.dataPackFolder + (options.dataPackFolder.endsWith('.zip') ? '' : '.zip')
		console.time('Writing Zip took')
		await writeZip(exportedFiles, exportPath)
		console.timeEnd('Writing Zip took')
	}

	console.timeEnd('Data Pack Compilation took')
}

async function writeZip(map: Map<string, string>, dataPackPath: string) {
	const data: Record<string, Uint8Array> = {}

	for (const [path, content] of map) {
		const relativePath = PathModule.relative(dataPackPath, path)
		if (typeof content === 'string') {
			data[relativePath] = Buffer.from(content)
		} else {
			data[relativePath] = content
		}
	}

	const zipped = await zip(data, {})
	await fs.promises.writeFile(dataPackPath, zipped)
}

async function writeFiles(map: Map<string, string>, dataPackFolder: string) {
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
			merged.values = merged.values.filter(v => {
				const value = typeof v === 'string' ? v : v.id
				const isTag = value.startsWith('#')
				const location = parseResourceLocation(isTag ? value.substring(1) : value)
				const vPath = PathModule.join(
					dataPackFolder,
					'data',
					location.namespace,
					isTag ? 'tags/function' : 'function',
					location.path + (isTag ? '.json' : '.mcfunction')
				)
				const exists = map.has(vPath) || fs.existsSync(vPath)
				if (!exists) {
					const parentLocation = parseDataPackPath(path)
					console.warn(
						`The referenced ${isTag ? 'tag' : 'function'} '${value}' in '${
							parentLocation?.resourceLocation || path
						}' does not exist! Removing reference...`
					)
				}
				return exists
			})
			content = JSON.stringify(merged)
		}

		const folderPath = PathModule.dirname(path)
		if (!folderCache.has(folderPath)) {
			await fs.promises.mkdir(folderPath, { recursive: true })
			folderCache.add(folderPath)
		}
		await fs.promises.writeFile(path, content)
		PROGRESS.set(PROGRESS.get() + 1)
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
