import { Compiler, Parser, Tokenizer, SyncIo } from 'mc-build'
import { VariableMap } from 'mc-build/dist/mcl/Compiler'
import { isFunctionTagPath } from '../../util/fileUtil'
import mcbFiles from '../datapackCompiler/mcbFiles'
import { AnyRenderedNode, IRenderedRig, IRenderedVariant } from '../rigRenderer'
import { IRenderedAnimation } from '../animationRenderer'
import { Variant } from '../../variants'
import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtList, NbtString } from 'deepslate/lib/nbt'
import {
	arrayToNbtFloatArray,
	getFunctionNamespace,
	matrixToNbtFloatArray,
	replacePathPart,
	sortObjectKeys,
	transformationToNbt,
} from '../util'
import { BoneConfig, TextDisplayConfig } from '../../nodeConfigs'
import {
	getDataPackFormat,
	IFunctionTag,
	mergeTag,
	parseBlock,
	parseDataPackPath,
	parseResourceLocation,
} from '../../util/minecraftUtil'
import { JsonText } from '../minecraft/jsonText'
import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/exportProgressDialog'
import { eulerFromQuaternion, floatToHex, roundTo, tinycolorToDecimal } from '../../util/misc'
import { MSLimiter } from '../../util/msLimiter'

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

const TELLRAW_PREFIX = () =>
	new JsonText([
		{ text: '\n[', color: 'gray' },
		{ text: 'AJ', color: 'aqua' },
		'] ',
		[
			{ text: '(from ', color: 'gray', italic: true },
			Project!.animated_java.export_namespace,
			')',
		],
		' -> ',
	])

const TELLRAW_ERROR_PREFIX = () =>
	new JsonText([TELLRAW_PREFIX(), { text: 'ERROR: ', color: 'red' }, '\n '])

const TELLRAW_SUFFIX = () => new JsonText(['\n'])

const TELLRAW_LEARN_MORE_LINK = (url: string) =>
	new JsonText([
		'\n ',
		{
			text: 'Click here to learn more',
			color: 'blue',
			underlined: true,
			italic: true,
			clickEvent: { action: 'open_url', value: url },
		},
	])

namespace TELLRAW {
	export const RIG_OUTDATED = () =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
			{ text: 'The ', color: 'red' },
			{ text: Project!.animated_java.export_namespace, color: 'yellow' },
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
			TELLRAW_SUFFIX(),
		])
	export const RIG_OUTDATED_TEXT_DISPLAY = () =>
		new JsonText([
			'',
			{
				text: 'This rig instance is outdated!\\nIt will not function correctly and should be removed or re-summoned.',
				color: 'red',
			},
		])
	export const FUNCTION_NOT_EXECUTED_AS_ROOT_ERROR = (functionName: string) =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
			{
				text: 'This function',
				color: 'blue',
				underlined: true,
				hoverEvent: {
					action: 'show_text',
					contents: [{ text: functionName, color: 'yellow' }],
				},
			},
			{ text: " must be executed as the rig's root entity.", color: 'red' },
			'\n',
			TELLRAW_LEARN_MORE_LINK(
				'https://animated-java.dev/docs/exported-rigs/controlling-a-rig-instance'
			),
			TELLRAW_SUFFIX(),
		])
	// Summon Function
	export const VARIANT_CANNOT_BE_EMPTY = () =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
			{ text: 'variant', color: 'yellow' },
			{ text: ' cannot be an empty string.', color: 'red' },
			TELLRAW_SUFFIX(),
		])
	export const INVALID_VARIANT = (
		variantName: string,
		variants: Record<string, IRenderedVariant>
	) =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
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
			TELLRAW_SUFFIX(),
		])
	export const ANIMATION_CANNOT_BE_EMPTY = () =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
			{ text: 'animation', color: 'yellow' },
			{ text: ' cannot be an empty string.', color: 'red' },
			TELLRAW_SUFFIX(),
		])
	export const FRAME_CANNOT_BE_NEGATIVE = () =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
			{ text: 'frame', color: 'yellow' },
			{ text: ' must be a non-negative integer.', color: 'red' },
			TELLRAW_SUFFIX(),
		])
	export const INVALID_ANIMATION = (animationName: string, animations: IRenderedAnimation[]) =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
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
			TELLRAW_SUFFIX(),
		])
	export const NO_VARIANTS = () =>
		new JsonText([
			'',
			TELLRAW_ERROR_PREFIX(),
			{ text: 'No variants are available.', color: 'red' },
			TELLRAW_SUFFIX(),
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
				passenger.set('item', item.set('id', new NbtString(aj.display_item)))
				switch (aj.target_minecraft_version) {
					case '1.20.4': {
						item.set(
							'tag',
							new NbtCompound().set(
								'CustomModelData',
								new NbtInt(variantModel.custom_model_data)
							)
						)
						item.set('Count', new NbtInt(1))
						break
					}
					case '1.20.5':
					case '1.21.0': {
						item.set(
							'components',
							new NbtCompound().set(
								'minecraft:custom_model_data',
								new NbtInt(variantModel.custom_model_data)
							)
						)
						item.set('count', new NbtInt(1))
						break
					}
					case '1.21.2':
					case '1.21.4': {
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
						item.set('count', new NbtInt(1))
						break
					}
				}

				if (node.configs?.default) {
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
			default: {
				// Skips nodes that are not actually riding the root entity.
				continue
			}
		}

		passengers.add(passenger)
	}

	return passengers.toString()
}

export class DataPackAJMeta {
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
				if (!transform) {
					console.warn('No transform found for node:', node)
					continue
				}
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
			if (frame.variant) {
				thisFrame.set(
					'variant',
					new NbtCompound()
						.set('name', new NbtString(rig.variants[frame.variant.uuid].name))
						.set('condition', new NbtString(frame.variant.execute_condition ? `${frame.variant.execute_condition} ` : ''))
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

export default async function compileDataPack(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	dataPackFolder: string
	rigHash: string
	animationHash: string
}) {
	console.time('Data Pack Compilation took')
	const { rig, animations, rigHash, animationHash, dataPackFolder } = options
	const overrideFolder = PathModule.join(dataPackFolder, 'animated_java')

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
		formatVersion: getDataPackFormat(aj.target_minecraft_version),
	})

	let ajmeta: DataPackAJMeta | null = null
	if (aj.data_pack_export_mode === 'raw') {
		ajmeta = new DataPackAJMeta(
			PathModule.join(dataPackFolder, 'data.ajmeta'),
			aj.export_namespace,
			Project!.last_used_export_namespace,
			dataPackFolder
		)
		ajmeta.read()

		PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(ajmeta.oldFiles.size)
		const removedFolders = new Set<string>()
		for (const file of ajmeta.oldFiles) {
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
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}
	}

	const exportedFiles = new Map<string, string>()
	function createSyncIO(): SyncIo {
		const io = new SyncIo()
		io.write = (localPath, content) => {
			const writePath = PathModule.join(overrideFolder, localPath)
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
		show_function_errors: aj.show_function_errors,
		show_outdated_warning: aj.show_outdated_warning,
		has_locators: Object.values(rig.nodes).filter(n => n.type === 'locator').length > 0,
		has_entity_locators:
			Object.values(rig.nodes).filter(n => n.type === 'locator' && n.config?.use_entity)
				.length > 0,
		has_cameras: Object.values(rig.nodes).filter(n => n.type === 'camera').length > 0,
	}
	console.log('Compiler Variables:', variables)

	const mcbFile =
		animations.length === 0
			? mcbFiles[aj.target_minecraft_version].static
			: mcbFiles[aj.target_minecraft_version].animation

	PROGRESS_DESCRIPTION.set('Compiling Data Pack...')
	PROGRESS.set(0)
	await new Promise(resolve => requestAnimationFrame(resolve))
	console.time('MC-Build Compiler took')
	const tokens = Tokenizer.tokenize(mcbFile, 'src/animated_java.mcb')
	compiler.addFile('src/animated_java.mcb', Parser.parseMcbFile(tokens))
	compiler.compile(VariableMap.fromObject(variables))
	console.timeEnd('MC-Build Compiler took')

	// Incorrect version warning
	const functionNamespace = getFunctionNamespace(aj.target_minecraft_version)
	const invalidVersionMessage = new JsonText([
		TELLRAW_ERROR_PREFIX(),
		[
			{
				text: 'Attempting to load an Animated Java Data Pack that was exported for ',
				color: 'red',
			},
			{ text: `Minecraft ${aj.target_minecraft_version}`, color: 'aqua' },
			{ text: ' in the wrong version!', color: 'red' },
			{
				text: '\n Please ensure that the data pack is loaded in the correct version, or that your blueprint settings are configured to target the correct version(s) of Minecraft.',
				color: 'yellow',
			},
		],
		TELLRAW_SUFFIX(),
	])
	exportedFiles.set(
		PathModule.join(
			dataPackFolder,
			`data/animated_java/${functionNamespace}/global/on_load.mcfunction`
		),
		`tellraw @a ${invalidVersionMessage}`
	)
	exportedFiles.set(
		PathModule.join(dataPackFolder, `data/minecraft/tags/${functionNamespace}/load.json`),
		autoStringify({
			replace: false,
			values: ['animated_java:global/on_load'],
		})
	)

	type Formats = number | number[] | { min_inclusive: number; max_inclusive: number }
	interface IPackMeta {
		pack?: {
			pack_format?: number
			description?: string
		}
		overlays?: {
			entries?: Array<{
				directory?: string
				formats?: Formats
			}>
		}
	}

	// pack.mcmeta
	const packMetaPath = PathModule.join(dataPackFolder, 'pack.mcmeta')
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
	packMeta.pack.pack_format = getDataPackFormat(aj.target_minecraft_version)
	packMeta.pack.description ??= `Animated Java Data Pack for ${aj.target_minecraft_version}`
	packMeta.overlays ??= {}
	packMeta.overlays.entries ??= []
	let formats: Formats
	switch (aj.target_minecraft_version) {
		case '1.20.5': {
			formats = {
				min_inclusive: getDataPackFormat('1.20.5'),
				max_inclusive: getDataPackFormat('1.21.0') - 1,
			}
			break
		}
		case '1.21.0': {
			formats = {
				min_inclusive: getDataPackFormat('1.21.0'),
				max_inclusive: getDataPackFormat('1.21.2') - 1,
			}
			break
		}
		case '1.21.2': {
			formats = {
				min_inclusive: getDataPackFormat('1.21.2'),
				max_inclusive: getDataPackFormat('1.21.4') - 1,
			}
			break
		}
		case '1.21.4': {
			formats = getDataPackFormat('1.21.4')
			break
		}
		default: {
			formats = getDataPackFormat(aj.target_minecraft_version)
			break
		}
	}
	const overlay = packMeta.overlays.entries.find(e => e.directory === 'animated_java')
	if (!overlay) {
		packMeta.overlays.entries.push({
			directory: 'animated_java',
			formats,
		})
	} else {
		overlay.formats = formats
	}

	exportedFiles.set(PathModule.join(dataPackFolder, 'pack.mcmeta'), autoStringify(packMeta))

	PROGRESS_DESCRIPTION.set('Writing Data Pack...')
	if (aj.data_pack_export_mode === 'raw') {
		console.time('Writing Files took')
		await writeFiles(exportedFiles, overrideFolder)
		console.timeEnd('Writing Files took')
		ajmeta!.write()
	}

	console.timeEnd('Data Pack Compilation took')
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
				const functionNamespace = getFunctionNamespace(aj.target_minecraft_version)
				console.log('Checking:', value, location, functionNamespace)
				const vPath = PathModule.join(
					dataPackFolder,
					'data',
					location.namespace,
					isTag ? 'tags/' + functionNamespace : functionNamespace,
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
