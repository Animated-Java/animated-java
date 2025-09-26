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
	type IFunctionTag,
	mergeTag,
	parseBlock,
	parseDataPackPath,
	parseResourceLocation,
	toSmallCaps,
} from '../../util/minecraftUtil'
import { eulerFromQuaternion, floatToHex, roundTo, tinycolorToDecimal } from '../../util/misc'
import { MSLimiter } from '../../util/msLimiter'
import { Variant } from '../../variants'
import type { IRenderedAnimation } from '../animationRenderer'
import mcbFiles from '../datapackCompiler/mcbFiles'
import { IntentionalExportError } from '../exporter'
import { AJMeta, type MinecraftVersion, PackMeta, type PackMetaFormats } from '../global'
import { JsonText } from '../minecraft/jsonText'
import type { AnyRenderedNode, IRenderedRig, IRenderedVariant } from '../rigRenderer'
import {
	arrayToNbtFloatArray,
	type ExportedFile,
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

function getNodeTags(node: AnyRenderedNode, rig: IRenderedRig): NbtList {
	const tags: string[] = []

	const parentNames: Array<{ name: string; type: string }> = []

	function recurseParents(n: AnyRenderedNode) {
		if (n.parent === 'root') {
			// Root is ignored
		} else if (n.parent) {
			parentNames.push({
				name: rig.nodes[n.parent].storage_name,
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
		TAGS.GLOBAL_NODE_NAMED(node.storage_name),
		// Project
		TAGS.PROJECT_ENTITY(Project!.animated_java.export_namespace),
		TAGS.PROJECT_NODE(Project!.animated_java.export_namespace),
		TAGS.PROJECT_NODE_NAMED(Project!.animated_java.export_namespace, node.storage_name)
	)

	if (!hasParent) {
		tags.push(TAGS.GLOBAL_ROOT_CHILD())
	}
	switch (node.type) {
		case 'bone': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_BONE(),
				TAGS.GLOBAL_BONE_TREE(node.storage_name), // Tree includes self
				TAGS.GLOBAL_BONE_TREE_BONE(node.storage_name), // Tree includes self
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
				),
				TAGS.PROJECT_BONE(Project!.animated_java.export_namespace),
				TAGS.PROJECT_BONE_NAMED(Project!.animated_java.export_namespace, node.storage_name),
				TAGS.PROJECT_BONE_TREE(Project!.animated_java.export_namespace, node.storage_name), // Tree includes self
				TAGS.PROJECT_BONE_TREE_BONE(
					Project!.animated_java.export_namespace,
					node.storage_name
				) // Tree includes self
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
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_ITEM_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
				),
				TAGS.PROJECT_ITEM_DISPLAY(Project!.animated_java.export_namespace),
				TAGS.PROJECT_ITEM_DISPLAY_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
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
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_BLOCK_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
				),
				TAGS.PROJECT_BLOCK_DISPLAY(Project!.animated_java.export_namespace),
				TAGS.PROJECT_BLOCK_DISPLAY_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
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
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_TEXT_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
				),
				TAGS.PROJECT_TEXT_DISPLAY(Project!.animated_java.export_namespace),
				TAGS.PROJECT_TEXT_DISPLAY_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
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
				TAGS.PROJECT_LOCATOR_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
				)
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
				TAGS.PROJECT_CAMERA_NAMED(
					Project!.animated_java.export_namespace,
					node.storage_name
				)
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

namespace TELLRAW {
	const TELLRAW_PREFIX = () =>
		new JsonText([
			{ text: '\n ', color: 'gray' },
			{ text: 'ᴀɴɪᴍᴀᴛᴇᴅ ᴊᴀᴠᴀ', color: '#00aced' },
			{ text: ' ' },
			{
				text: `\n (animated_java:${Project!.animated_java.export_namespace})`,
				color: 'dark_gray',
				italic: true,
			},
			{ text: '\n → ' },
		])

	const TELLRAW_SUFFIX = () => new JsonText(['\n'])

	const TELLRAW_ERROR = (errorName: string, details: JsonText) =>
		new JsonText([
			TELLRAW_PREFIX(),
			{ text: 'ᴇʀʀᴏʀ: ', color: 'red' },
			{ text: errorName, color: 'red', underlined: true },
			{ text: '\n\n ' },
			[details],
			TELLRAW_SUFFIX(),
		])

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

	export const RIG_OUTDATED = () =>
		TELLRAW_ERROR(
			'Outdated Rig Instance',
			new JsonText([
				{ text: 'The instance of ', color: 'red' },
				{ text: Project!.animated_java.export_namespace, color: 'yellow' },
				{ text: ' at ' },
				{ text: '$(x), $(y), $(z)', color: 'yellow' },
				{ text: ' was summoned using an older export of its Blueprint.' },
				{ text: ' It should be removed and re-summoned to ensure it functions correctly.' },
				{ text: '\n\n ≡ ', color: 'white' },
				{
					text: toSmallCaps('Teleport to Instance'),
					clickEvent: {
						action: 'suggest_command',
						value: '/tp @s $(uuid)',
					},
					color: 'aqua',
					underlined: true,
				},
				{ text: '\n ≡ ', color: 'white' },
				{
					text: toSmallCaps('Remove Instance'),
					clickEvent: {
						action: 'suggest_command',
						value: `/execute as $(uuid) run function animated_java:${
							Project!.animated_java.export_namespace
						}/remove/this`,
					},
					color: 'aqua',
					underlined: true,
				},
			])
		)

	export const RIG_OUTDATED_TEXT_DISPLAY = () =>
		new JsonText([
			{ text: '⚠ This rig instance is outdated! ', color: 'red' },
			{ text: '\\n It should be removed and re-summoned to ensure it functions correctly.' },
		])

	export const FUNCTION_NOT_EXECUTED_AS_ROOT_ERROR = (functionName: string) =>
		TELLRAW_ERROR(
			'Function Not Executed as Root Entity',
			new JsonText([
				{ text: '', color: 'red' },
				{
					text: 'This function',
					color: 'yellow',
					underlined: true,
					hoverEvent: {
						action: 'show_text',
						contents: [{ text: functionName, color: 'yellow' }],
					},
				},
				{ text: " must be executed as the rig's root entity.\n" },
				TELLRAW_LEARN_MORE_LINK(
					'https://animated-java.dev/docs/rigs/controlling-a-rig-instance'
				),
			])
		)

	export const INVALID_VARIANT = (variants: Record<string, IRenderedVariant>) =>
		TELLRAW_ERROR(
			'Invalid Variant',
			new JsonText([
				{ text: 'The variant ', color: 'red' },
				{ nbt: 'args.variant', storage: 'aj:temp', color: 'yellow' },
				{ text: ' does not exist.', color: 'red' },
				'\n ',
				{ text: ' ≡ ', color: 'white' },
				{ text: 'Available Variants:', color: 'green' },
				...Object.values(variants).map(
					variant =>
						new JsonText([
							{ text: '\n ', color: 'gray' },
							{ text: ' ' },
							{ text: ' ' },
							{ text: ' ' },
							{ text: ' ● ' },
							{ text: variant.name, color: 'yellow' },
						])
				),
			])
		)

	export const FRAME_CANNOT_BE_NEGATIVE = () =>
		TELLRAW_ERROR(
			'Frame cannot be negative',
			new JsonText([
				{ text: 'frame', color: 'yellow' },
				{ text: ' must be a non-negative integer.', color: 'red' },
			])
		)

	export const INVALID_ANIMATION = (animations: IRenderedAnimation[]) =>
		TELLRAW_ERROR(
			'Invalid Animation',
			new JsonText([
				{ text: 'The animation ', color: 'red' },
				{ nbt: 'args.animation', storage: 'aj:temp', color: 'yellow' },
				{ text: ' does not exist.', color: 'red' },
				'\n ',
				{ text: ' ≡ ', color: 'white' },
				{ text: 'Available Animations:', color: 'green' },
				...animations.map(
					anim =>
						new JsonText([
							{ text: '\n ', color: 'gray' },
							{ text: ' ' },
							{ text: ' ' },
							{ text: ' ' },
							{ text: ' ● ' },
							{ text: anim.storage_name, color: 'yellow' },
						])
				),
			])
		)

	export const NO_VARIANTS = () =>
		TELLRAW_ERROR(
			'No Variants',
			new JsonText([
				{
					text: 'This Blueprint has no variants to switch between.',
					color: 'red',
				},
			])
		)

	export const INVALID_VERSION = () =>
		TELLRAW_ERROR(
			'Invalid Minecraft Version',
			new JsonText([
				{
					text: 'Attempted to load an Animated Java Data Pack that was exported for ',
					color: 'red',
				},
				{
					text: `Minecraft ${Project!.animated_java.target_minecraft_versions}`,
					color: 'aqua',
				},
				{ text: ' in the wrong version!', color: 'red' },
				{
					text: '\n Please ensure that the data pack is loaded in the correct version, or that your Blueprint settings are configured to target the correct version(s) of Minecraft.',
					color: 'red',
				},
			])
		)

	export const UNINSTALL = () =>
		new JsonText([
			TELLRAW_PREFIX(),
			[
				{ text: 'Successfully uninstalled ', color: 'green' },
				{ text: Project!.animated_java.export_namespace, color: 'yellow' },
				{ text: '!' },
				{
					text: '\n If you have exported multiple times, you may have to remove objectives from previous exports manually, as Animated Java only knows about the objectives from the most recent export.',
					color: 'gray',
					italic: true,
				},
			],
			TELLRAW_SUFFIX(),
		])

	export const ARGUMENT_CANNOT_BE_EMPTY = (name: string) =>
		TELLRAW_ERROR(
			'Argument Cannot Be Empty',
			new JsonText([
				{ text: 'Argument ', color: 'red' },
				{ text: name, color: 'yellow' },
				{ text: ' cannot be an empty string.', color: 'red' },
			])
		)

	export const LOCATOR_NOT_FOUND = () =>
		TELLRAW_ERROR(
			'Locator Not Found',
			new JsonText([
				{ text: 'Locator ', color: 'red' },
				{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
				{ text: ' not found!' },
				{ text: '\n Please ensure that the name is spelled correctly.' },
			])
		)

	export const LOCATOR_ENTITY_NOT_FOUND = () =>
		TELLRAW_ERROR(
			'Locator Not Found',
			new JsonText([
				{ text: 'Locator ', color: 'red' },
				{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
				{ text: ' does not exist!' },
				{ text: '\n Please ensure that the name is spelled correctly, and ' },
				{ text: '"Use Entity"', color: 'yellow' },
				{ text: " is enabled in the locator's config." },
			])
		)

	export const LOCATOR_COMMAND_FAILED_TO_EXECUTE = () =>
		TELLRAW_ERROR(
			'Failed to Execute Command as Locator',
			new JsonText([
				{ text: 'Failed to execute command ', color: 'red' },
				{ nbt: 'args.command', storage: 'aj:temp', color: 'yellow' },
				{ text: ' as Locator ' },
				{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
				{ text: '.' },
				{ text: '\n Please ensure the command is valid.' },
			])
		)

	export const CAMERA_ENTITY_NOT_FOUND = () =>
		TELLRAW_ERROR(
			'Camera Not Found',
			new JsonText([
				{ text: 'Camera ', color: 'red' },
				{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
				{ text: ' does not exist!' },
				{ text: '\n Please ensure that its name is spelled correctly.' },
			])
		)

	export const CAMERA_COMMAND_FAILED_TO_EXECUTE = () =>
		TELLRAW_ERROR(
			'Failed to Execute Command as Camera',
			new JsonText([
				{ text: 'Failed to execute command ', color: 'red' },
				{ nbt: 'args.command', storage: 'aj:temp', color: 'yellow' },
				{ text: ' as Camera ' },
				{ nbt: 'args.name', storage: 'aj:temp', color: 'aqua' },
				{ text: '.' },
				{ text: '\n Please ensure the command is valid.' },
			])
		)
}

async function generateRootEntityPassengers(
	version: MinecraftVersion,
	rig: IRenderedRig,
	rigHash: string
) {
	const aj = Project!.animated_java
	const passengers: NbtList = new NbtList()

	const { locators, cameras, uuids } = createPassengerStorage(rig)

	const dataEntity = new NbtCompound()

	switch (version) {
		case '1.20.4':
		case '1.20.5':
		case '1.21.0':
		case '1.21.2':
		case '1.21.4':
			dataEntity.set('id', new NbtString('minecraft:marker'))
			break
		case '1.21.5':
			dataEntity.set('id', new NbtString('minecraft:item_display'))
	}
	passengers.add(
		dataEntity
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

		if (BONE_TYPES.includes(node.type)) {
			passenger
				.set('height', new NbtFloat(aj.bounding_box[1]))
				.set('width', new NbtFloat(aj.bounding_box[0]))
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
					default: {
						throw new Error(
							`Unsupported Minecraft version '${version}' for item display!`
						)
					}
				}

				if (node.configs?.default) {
					BoneConfig.fromJSON(node.configs.default).toNBT(passenger)
				}
				break
			}
			case 'text_display': {
				passenger.set('id', new NbtString('minecraft:text_display'))
				)


				switch (version) {
					case '1.20.4':
					case '1.20.5':
					case '1.21.0':
					case '1.21.2':
					case '1.21.4':
						passenger.set(
							'text',
							// String JSON text format
							new NbtString(
								node.text?.toString() ?? `{ "text": "Invalid Text Component" }`
							)
						)
						break
					case '1.21.5':
						passenger.set(
							'text',
							// SNBT JSON text format
							NbtTag.fromString(
								node.text?.toString() ?? "{ text: 'Invalid Text Component' }"
							)
						)
						break
					default: {
						throw new Error(
							`Unsupported Minecraft version '${version}' for text display!`
						)
					}
				}

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
						`Invalid Blockstate '${node.block}' in node '${node.storage_name}'!`
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
		BONE_TYPES,
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
			await fs.promises.writeFile(
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
