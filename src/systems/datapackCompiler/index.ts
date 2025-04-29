import {
	NbtByte,
	NbtCompound,
	NbtFloat,
	NbtInt,
	NbtList,
	NbtString,
	NbtTag,
} from 'deepslate/lib/nbt'
import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { BoneConfig, TextDisplayConfig } from '../../nodeConfigs'
import { isFunctionTagPath } from '../../util/fileUtil'
import {
	getDataPackFormat,
	IFunctionTag,
	mergeTag,
	parseBlock,
	parseDataPackPath,
	parseResourceLocation,
} from '../../util/minecraftUtil'
import { eulerFromQuaternion, floatToHex, roundTo, tinycolorToDecimal } from '../../util/misc'
import { MSLimiter } from '../../util/msLimiter'
import { Variant } from '../../variants'
import { IRenderedAnimation } from '../animationRenderer'
import mcbFiles from '../datapackCompiler/mcbFiles'
import { IntentionalExportError } from '../exporter'
import { AJMeta, MinecraftVersion, PackMeta, PackMetaFormats } from '../global'
import { JsonText } from '../minecraft/jsonText'
import { AnyRenderedNode, IRenderedRig, IRenderedVariant } from '../rigRenderer'
import {
	arrayToNbtFloatArray,
	ExportedFile,
	matrixToNbtFloatArray,
	replacePathPart,
	transformationToNbt,
} from '../util'
import { compile } from './compiler'
import { TAGS } from './tags'

const BONE_TYPES = ['bone', 'text_display', 'item_display', 'block_display']

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

function getNodeTags(node: AnyRenderedNode, rig: IRenderedRig): NbtList {
	const tags: string[] = []

	const parentNames: Array<{ name: string; type: string }> = []

	function recurseParents(n: AnyRenderedNode) {
		if (n.parent === 'root') {
			// Root is ignored
		} else if (n.parent) {
			parentNames.push({
				name: rig.nodes[n.parent].path_name,
				type: rig.nodes[n.parent].type,
			})
			recurseParents(rig.nodes[n.parent])
		}
	}
	recurseParents(node)

	const hasParent = node.parent && node.parent !== 'root'

	tags.push(
		// Global
		TAGS.NEW(),
		TAGS.GLOBAL_ENTITY(),
		TAGS.GLOBAL_NODE(),
		TAGS.GLOBAL_NODE_NAMED(node.path_name),
		// Project
		TAGS.PROJECT_ENTITY(Project!.animated_java.export_namespace),
		TAGS.PROJECT_NODE(Project!.animated_java.export_namespace),
		TAGS.PROJECT_NODE_NAMED(Project!.animated_java.export_namespace, node.path_name)
	)

	if (!hasParent) {
		tags.push(TAGS.GLOBAL_ROOT_CHILD())
	}
	switch (node.type) {
		case 'bone': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_BONE(),
				TAGS.GLOBAL_BONE_TREE(node.path_name), // Tree includes self
				TAGS.GLOBAL_BONE_TREE_BONE(node.path_name), // Tree includes self
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.path_name
				),
				TAGS.PROJECT_BONE(Project!.animated_java.export_namespace),
				TAGS.PROJECT_BONE_NAMED(Project!.animated_java.export_namespace, node.path_name),
				TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, node.path_name), // Tree includes self
				TAGS.PROJECT_BONE_TREE_BONE(Project!.animated_java.export_namespace, node.path_name) // Tree includes self
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_BONE())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_BONE(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_BONE(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_BONE(name),
					TAGS.GLOBAL_BONE_TREE(name),
					TAGS.GLOBAL_BONE_TREE_BONE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_DECENDANT_BONE(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_TREE_BONE(Project!.animated_java.export_namespace, name)
				)
			}
			break
		}
		case 'item_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_ITEM_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.path_name
				),
				TAGS.PROJECT_ITEM_DISPLAY(Project!.animated_java.export_namespace),
				TAGS.PROJECT_ITEM_DISPLAY_NAMED(
					Project!.animated_java.export_namespace,
					node.path_name
				)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_ITEM_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_ITEM_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_ITEM_DISPLAY(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_ITEM_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_DECENDANT_ITEM_DISPLAY(
						Project!.animated_java.export_namespace,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, name)
				)
			}
			break
		}
		case 'block_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_BLOCK_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.path_name
				),
				TAGS.PROJECT_BLOCK_DISPLAY(Project!.animated_java.export_namespace),
				TAGS.PROJECT_BLOCK_DISPLAY_NAMED(
					Project!.animated_java.export_namespace,
					node.path_name
				)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_BLOCK_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_BLOCK_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_BLOCK_DISPLAY(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_BLOCK_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_DECENDANT_BLOCK_DISPLAY(
						Project!.animated_java.export_namespace,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, name)
				)
			}
			break
		}
		case 'text_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_TEXT_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.path_name
				),
				TAGS.PROJECT_TEXT_DISPLAY(Project!.animated_java.export_namespace),
				TAGS.PROJECT_TEXT_DISPLAY_NAMED(
					Project!.animated_java.export_namespace,
					node.path_name
				)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_TEXT_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_TEXT_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_TEXT_DISPLAY(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_TEXT_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_DECENDANT_TEXT_DISPLAY(
						Project!.animated_java.export_namespace,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, name)
				)
			}
			break
		}
		case 'locator': {
			tags.push(
				// Global
				TAGS.GLOBAL_LOCATOR(),
				// Project
				TAGS.PROJECT_LOCATOR(Project!.animated_java.export_namespace),
				TAGS.PROJECT_LOCATOR_NAMED(Project!.animated_java.export_namespace, node.path_name)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_LOCATOR())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_LOCATOR(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_LOCATOR(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_LOCATOR(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_DECENDANT_LOCATOR(
						Project!.animated_java.export_namespace,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, name)
				)
			}
			break
		}
		case 'camera': {
			tags.push(
				// Global
				TAGS.GLOBAL_CAMERA(),
				// Project
				TAGS.PROJECT_CAMERA(Project!.animated_java.export_namespace),
				TAGS.PROJECT_CAMERA_NAMED(Project!.animated_java.export_namespace, node.path_name)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_CAMERA())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_CAMERA(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_CAMERA(
						Project!.animated_java.export_namespace,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_CAMERA(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.export_namespace, name),
					TAGS.PROJECT_BONE_DECENDANT_CAMERA(
						Project!.animated_java.export_namespace,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, name)
				)
			}
			break
		}
		default: {
			throw new IntentionalExportError(
				`Attempted to get tags for an unknown node type: '${node.type}'!`
			)
		}
	}

	return new NbtList(tags.sort().map(v => new NbtString(v)))
}

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
				'https://animated-java.dev/docs/rigs/controlling-a-rig-instance'
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
						{ text: anim.path_name, color: 'yellow' },
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
	export const INVALID_VERSION = () =>
		new JsonText([
			TELLRAW_ERROR_PREFIX(),
			[
				{
					text: 'Attempting to load an Animated Java Data Pack that was exported for ',
					color: 'red',
				},
				{
					text: `Minecraft ${Project!.animated_java.target_minecraft_versions}`,
					color: 'aqua',
				},
				{ text: ' in the wrong version!', color: 'red' },
				{
					text: '\n Please ensure that the data pack is loaded in the correct version, or that your blueprint settings are configured to target the correct version(s) of Minecraft.',
					color: 'yellow',
				},
			],
			TELLRAW_SUFFIX(),
		])
	export const UNINSTALL = () =>
		new JsonText([
			TELLRAW_PREFIX(),
			{ text: 'Successfully removed known animation scoreboard objectives.', color: 'red' },
			{
				text: "\nIf you have exported multiple times you may have to manually remove some objectives from previous exports manually, as Animated Java can only remove the latest export's objectives.",
				color: 'gray',
				italic: true,
			},
			TELLRAW_SUFFIX(),
		])
	export const LOCATOR_NOT_FOUND = () =>
		new JsonText([
			TELLRAW_PREFIX(),
			{ text: 'Locator ', color: 'red' },
			{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
			{ text: ' not found!', color: 'red' },
			{
				text: "\nPlease ensure that it's name is spelled correctly.",
				color: 'gray',
				italic: true,
			},
			TELLRAW_SUFFIX(),
		])
	export const LOCATOR_NOT_FOUND_ENTITY = () =>
		new JsonText([
			TELLRAW_PREFIX(),
			{ text: 'Locator ', color: 'red' },
			{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
			{ text: ' not found!', color: 'red' },
			{
				text: '\nPlease ensure that the locator has ',
				color: 'gray',
				italic: true,
			},
			{
				text: 'Use Entity',
				color: 'yellow',
				italic: true,
			},
			{
				text: " enabled in it's config, and it's name is spelled correctly.",
				color: 'gray',
				italic: true,
			},
			TELLRAW_SUFFIX(),
		])
}

async function generateRootEntityPassengers(
	version: MinecraftVersion,
	rig: IRenderedRig,
	rigHash: string
) {
	const aj = Project!.animated_java
	const passengers: NbtList = new NbtList()

	const { locators, cameras, uuids } = createPassengerStorage(rig)

	passengers.add(
		new NbtCompound()
			.set('id', new NbtString('minecraft:item_display'))
			.set(
				'Tags',
				new NbtList([
					new NbtString(TAGS.NEW()),
					new NbtString(TAGS.GLOBAL_ENTITY()),
					new NbtString(TAGS.GLOBAL_DATA()),
					new NbtString(TAGS.PROJECT_ENTITY(aj.export_namespace)),
					new NbtString(TAGS.PROJECT_DATA(aj.export_namespace)),
				])
			)
			.set(
				'data',
				new NbtCompound()
					.set('rigHash', new NbtString(rigHash))
					.set('locators', locators)
					.set('cameras', cameras)
					.set('uuids', uuids)
			)
	)

	for (const [uuid, node] of Object.entries(rig.nodes)) {
		if (node.type === 'struct') continue

		const passenger = new NbtCompound()

		const tags = getNodeTags(node, rig)
		passenger.set('Tags', tags)

		switch (node.type) {
			case 'bone': {
				passenger.set('id', new NbtString('minecraft:item_display'))
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
					throw new Error(`Model for bone '${node.path_name}' not found!`)
				}
				passenger.set('item', item.set('id', new NbtString(aj.display_item)))
				switch (version) {
					case '1.20.4': {
						item.set(
							'tag',
							new NbtCompound().set(
								'CustomModelData',
								new NbtInt(variantModel.custom_model_data)
							)
						)
						// Count defaults to 1, but only in versions above 1.20.4
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
						break
					}
					case '1.21.2': {
						item.set(
							'components',
							new NbtCompound().set(
								'minecraft:item_model',
								new NbtString(variantModel.item_model)
							)
						)
						break
					}
					case '1.21.4':
					case '1.21.5': {
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
					NbtTag.fromString(
						node.text ? node.text.toString() : "{ text: 'Invalid Text Component' }"
					)
				)

				const color = new tinycolor(
					node.background_color + floatToHex(node.background_alpha)
				)
				passenger.set('background', new NbtInt(tinycolorToDecimal(color)))
				passenger.set('line_width', new NbtInt(node.line_width))
				passenger.set('shadow', new NbtByte(node.shadow ? 1 : 0))
				passenger.set('see_through', new NbtByte(node.see_through ? 1 : 0))
				passenger.set('alignment', new NbtString(node.align))

				if (node.config) {
					TextDisplayConfig.fromJSON(node.config).toNBT(passenger)
				}
				break
			}
			case 'item_display': {
				passenger.set('id', new NbtString('minecraft:item_display'))
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

				const parsed = await parseBlock(node.block)
				if (!parsed) {
					throw new Error(
						`Invalid Blockstate '${node.block}' in node '${node.path_name}'!`
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
			const str = `data modify storage aj.${
				Project!.animated_java.export_namespace
			}:animations ${animation.storage_name} merge value ${frames.toString()}`
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
						node.type.charAt(0) + '_' + node.storage_name,
						new NbtCompound()
							.set('transformation', matrixToNbtFloatArray(transform.matrix))
							.set('start_interpolation', new NbtInt(0))
					)
				} else {
					thisFrame.set(
						node.type.charAt(0) + '_' + node.storage_name,
						new NbtCompound()
							.set('posx', new NbtFloat(roundTo(transform.pos[0], 4)))
							.set('posy', new NbtFloat(roundTo(transform.pos[1], 4)))
							.set('posz', new NbtFloat(roundTo(transform.pos[2], 4)))
							.set('rotx', new NbtFloat(roundTo(transform.rot[0], 4)))
							.set('roty', new NbtFloat(roundTo(transform.rot[1], 4)))
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

function createPassengerStorage(rig: IRenderedRig) {
	const uuids = new NbtCompound()
	const locators = new NbtCompound()
	const cameras = new NbtCompound()
	// Data entity
	uuids.set('data_data', new NbtString(''))
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
				if (node.type === 'camera') {
					cameras.set(node.storage_name, data)
				} else {
					locators.set(node.storage_name, data)
				}
				uuids.set(node.type + '_' + node.storage_name, new NbtString(''))
				break
			}
			case 'bone':
			case 'text_display':
			case 'item_display':
			case 'block_display': {
				uuids.set(node.type + '_' + node.storage_name, new NbtString(''))
				break
			}
		}
	}
	return { locators, cameras, uuids }
}

function nodeSorter(a: AnyRenderedNode, b: AnyRenderedNode): number {
	if (a.type === 'locator' && b.type !== 'locator') return 1
	if (a.type !== 'locator' && b.type === 'locator') return -1
	return 0
}

interface DataPackCompilerOptions {
	ajmeta: AJMeta
	version: MinecraftVersion
	coreFiles: Map<string, ExportedFile>
	versionedFiles: Map<string, ExportedFile>
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	rigHash: string
	animationHash: string
}

export type DataPackCompiler = (options: DataPackCompilerOptions) => Promise<void>

interface CompileDataPackOptions {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	dataPackFolder: string
	rigHash: string
	animationHash: string
}

export default async function compileDataPack(
	targetVersions: MinecraftVersion[],
	options: CompileDataPackOptions
) {
	console.time('Data Pack Compilation took')

	const aj = Project!.animated_java

	const ajmeta = new AJMeta(
		PathModule.join(options.dataPackFolder, 'data.ajmeta'),
		aj.export_namespace,
		Project!.last_used_export_namespace,
		options.dataPackFolder
	)

	if (aj.data_pack_export_mode === 'raw') {
		ajmeta.read()
	}

	const globalCoreFiles = new Map<string, ExportedFile>()
	const globalVersionSpecificFiles = new Map<string, ExportedFile>()
	const coreDataPackFolder = options.dataPackFolder

	for (const version of targetVersions) {
		console.groupCollapsed(`Compiling data pack for Minecraft ${version}`)
		const coreFiles = new Map<string, ExportedFile>()
		const versionedFiles = new Map<string, ExportedFile>()

		const versionedDataPackFolder =
			targetVersions.length > 1
				? PathModule.join(
						options.dataPackFolder,
						`animated_java_${version.replaceAll('.', '_')}`
				  )
				: coreDataPackFolder

		await dataPackCompiler({
			...options,
			ajmeta,
			version,
			coreFiles,
			versionedFiles,
		})

		for (let [path, file] of coreFiles) {
			path = PathModule.join(coreDataPackFolder, path)
			globalCoreFiles.set(path, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.coreFiles.add(path)
		}

		for (let [path, file] of versionedFiles) {
			path = PathModule.join(versionedDataPackFolder, path)
			globalVersionSpecificFiles.set(path, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.versionedFiles.add(path)
		}

		console.groupEnd()
	}

	console.log('Exported Files:', globalCoreFiles.size + globalVersionSpecificFiles.size)

	const packMetaPath = PathModule.join(options.dataPackFolder, 'pack.mcmeta')
	let packMeta = new PackMeta(
		packMetaPath,
		0,
		[],
		`Animated Java Data Pack for ${targetVersions.join(', ')}`
	)
	packMeta.read()
	packMeta.pack_format = getDataPackFormat(targetVersions[0])
	packMeta.supportedFormats = []

	if (targetVersions.length > 1) {
		for (const version of targetVersions) {
			let format: PackMetaFormats = getDataPackFormat(version)
			packMeta.supportedFormats.push(format)

			const existingOverlay = [...packMeta.overlayEntries].find(
				e => e.directory === `animated_java_${version.replaceAll('.', '_')}`
			)
			if (!existingOverlay) {
				packMeta.overlayEntries.add({
					directory: `animated_java_${version.replaceAll('.', '_')}`,
					formats: format,
				})
			} else {
				existingOverlay.formats = format
			}
		}
	}

	globalCoreFiles.set(PathModule.join(options.dataPackFolder, 'pack.mcmeta'), {
		content: autoStringify(packMeta.toJSON()),
		includeInAJMeta: false,
	})

	if (aj.data_pack_export_mode === 'raw') {
		await removeFiles(ajmeta, options.dataPackFolder)

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
	}

	console.timeEnd('Data Pack Compilation took')
}

async function removeFiles(ajmeta: AJMeta, dataPackFolder: string) {
	console.time('Removing Files took')
	const aj = Project!.animated_java
	if (aj.data_pack_export_mode === 'raw') {
		PROGRESS_DESCRIPTION.set('Removing Old Data Pack Files...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(ajmeta.previousVersionedFiles.size)
		const removedFolders = new Set<string>()
		for (const file of ajmeta.previousVersionedFiles) {
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
				let content: IFunctionTag
				// Remove mentions of the export namespace from the file
				try {
					content = JSON.parse((await fs.promises.readFile(file)).toString())
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
	console.timeEnd('Removing Files took')
}

const dataPackCompiler: DataPackCompiler = async ({
	ajmeta,
	version,
	coreFiles,
	versionedFiles,
	rig,
	animations,
	rigHash,
	animationHash,
}) => {
	const aj = Project!.animated_java
	const is_static = animations.length === 0
	const variables = {
		export_namespace: aj.export_namespace,
		interpolation_duration: aj.interpolation_duration,
		teleportation_duration: aj.teleportation_duration,
		display_item: aj.display_item,
		rig,
		animations,
		export_version: Math.random().toString().substring(2, 10),
		root_entity_passengers: await generateRootEntityPassengers(version, rig, rigHash),
		TAGS,
		OBJECTIVES,
		TELLRAW,
		custom_summon_commands: aj.summon_commands,
		custom_remove_commands: aj.remove_commands,
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
		is_static,
		getNodeTags,
	}

	compile({
		path: 'src/animated_java.mcb',
		mcbFile: is_static ? mcbFiles[version].static : mcbFiles[version].animation,
		destPath: '.',
		variables,
		version,
		exportedFiles: versionedFiles,
	})

	compile({
		path: 'src/animated_java.mcb',
		mcbFile: mcbFiles[version].core,
		destPath: '.',
		variables,
		version,
		exportedFiles: coreFiles,
	})
}

async function writeFiles(exportedFiles: Map<string, ExportedFile>, dataPackFolder: string) {
	PROGRESS_DESCRIPTION.set('Writing Data Pack...')
	PROGRESS.set(0)
	MAX_PROGRESS.set(exportedFiles.size)
	const aj = Project!.animated_java
	const createdFolderCache = new Set<string>()

	const functionTagQueue = new Map<string, ExportedFile>()

	async function writeFile(path: string, file: ExportedFile) {
		if (isFunctionTagPath(path) && fs.existsSync(path)) {
			functionTagQueue.set(path, file)
			return
		}

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

	const maxWriteThreads = 8
	const writeQueue = new Map<string, Promise<void>>()
	for (const [path, data] of exportedFiles) {
		writeQueue.set(
			path,
			writeFile(path, data).finally(() => {
				writeQueue.delete(path)
			})
		)
		if (writeQueue.size >= maxWriteThreads) {
			await Promise.any(writeQueue)
		}
	}
	await Promise.all(writeQueue.values())

	for (const [path, file] of functionTagQueue.entries()) {
		const oldFile: IFunctionTag = JSON.parse(fs.readFileSync(path, 'utf-8'))
		const newFile: IFunctionTag = JSON.parse(file.content.toString())
		const merged = mergeTag(oldFile, newFile)
		if (aj.export_namespace !== Project!.last_used_export_namespace) {
			merged.values = merged.values.filter(v => {
				const value = typeof v === 'string' ? v : v.id
				return (
					!value.startsWith(`#animated_java:${Project!.last_used_export_namespace}/`) ||
					value.startsWith(`animated_java:${Project!.last_used_export_namespace}/`)
				)
			})
		}
		merged.values = merged.values
			.filter(v => {
				const value = typeof v === 'string' ? v : v.id
				const isTag = value.startsWith('#')
				const location = parseResourceLocation(isTag ? value.substring(1) : value)

				console.log('Checking:', value, location)

				let exists = false
				for (const folder of fs.readdirSync(dataPackFolder)) {
					const overrideFolder = PathModule.join(dataPackFolder, folder)
					if (!fs.statSync(overrideFolder).isDirectory()) continue
					const dataFolder =
						folder === 'data' ? overrideFolder : PathModule.join(overrideFolder, 'data')

					const path = isTag
						? PathModule.join(
								dataFolder,
								location.namespace,
								'tags/functions',
								location.path + '.json'
						  )
						: PathModule.join(
								dataFolder,
								location.namespace,
								'functions',
								location.path + '.mcfunction'
						  )
					console.log('Checking path:', path)
					if (
						!(
							fs.existsSync(path) ||
							fs.existsSync(
								path.replace(
									`${PathModule.sep}functions${PathModule.sep}`,
									`${PathModule.sep}function${PathModule.sep}`
								)
							)
						)
					)
						continue
					exists = true
					break
				}

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
			.sort()

		await fs.promises.writeFile(path, autoStringify(merged))
	}
}
