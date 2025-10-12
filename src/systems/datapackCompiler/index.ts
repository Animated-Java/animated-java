import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtList, NbtString } from 'deepslate/lib/nbt'
import { projectTargetVersionIsAtLeast } from 'src/formats/blueprint'
import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { BoneConfig, TextDisplayConfig } from '../../nodeConfigs'
import { isFunctionTagPath } from '../../util/fileUtil'
import {
	DataPackTag,
	type FunctionTagJSON,
	getDataPackFormat,
	parseBlock,
	parseDataPackPath,
	parseResourceLocation,
} from '../../util/minecraftUtil'
import { eulerFromQuaternion, roundTo } from '../../util/misc'
import { MSLimiter } from '../../util/msLimiter'
import { Variant } from '../../variants'
import type { IRenderedAnimation } from '../animationRenderer'
import mcbFiles from '../datapackCompiler/mcbFiles'
import { IntentionalExportError } from '../exporter'
import { AJMeta, PackMeta, type PackMetaFormats, SUPPORTED_MINECRAFT_VERSIONS } from '../global'
import { JsonText } from '../jsonText'
import { JsonTextParser } from '../jsonText/parser'
import type { AnyRenderedNode, IRenderedRig } from '../rigRenderer'
import {
	arrayToNbtFloatArray,
	type ExportedFile,
	matrixToNbtFloatArray,
	replacePathPart,
	transformationToNbt,
} from '../util'
import { compileMcbProject } from './mcbCompiler'
import { TAGS } from './tags'
import TELLRAW from './tellraw'

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

async function generateRootEntityPassengers(
	version: SUPPORTED_MINECRAFT_VERSIONS,
	rig: IRenderedRig,
	rigHash: string
) {
	const aj = Project!.animated_java
	const passengers: NbtList = new NbtList()

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
		default:
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
					.set('rig_hash', new NbtString(rigHash))
					.set('export_namespace', new NbtString(aj.export_namespace))
			)
	)

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

				switch (version) {
					case '1.20.4': {
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
				passenger
					.set('id', new NbtString('minecraft:text_display'))
					.set('background', new NbtInt(JsonText.hexToInt(node.background_color)))
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
							new JsonTextParser({ minecraftVersion: version })
								.parse(node.text)
								.toString(true, version)
						)
					)
				} else {
					throw new Error(`Unsupported Minecraft version '${version}' for text display!`)
				}

				if (node.config) {
					TextDisplayConfig.fromJSON(node.config).toNBT(passenger)
				}
				break
			}
			case 'item_display': {
				const item = new NbtCompound().set('id', new NbtString(node.item))
				passenger
					.set('id', new NbtString('minecraft:item_display'))
					.set('item', item)
					.set('item_display', new NbtString(node.item_display))

				switch (version) {
					case '1.20.4': {
						// `Count` does not default to 1.
						item.set('Count', new NbtInt(1))
						break
					}
					case '1.20.5':
					case '1.21.0':
					case '1.21.2':
					case '1.21.4':
					case '1.21.5': {
						// `count` defaults to 1, so we can omit it.
						break
					}
					default: {
						throw new Error(
							`Unsupported Minecraft version '${version}' for item display!`
						)
					}
				}

				if (node.config) {
					BoneConfig.fromJSON(node.config).toNBT(passenger)
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

	let result = passengers.toString()

	if (!compareVersions('1.21.5', version) /* >= 1.21.5 */) {
		for (const display of Object.values(rig.nodes).filter(n => n.type === 'text_display')) {
			result = result.replace(
				'"$$$' + display.type + '_' + display.storage_name + '_text_placeholder$$$"',
				new JsonTextParser({ minecraftVersion: version })
					.parse(display.text)
					.toString(true, version)
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
				Project!.animated_java.export_namespace
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
						node.type.charAt(0) + '_' + node.storage_name,
						new NbtCompound()
							.set('transformation', matrixToNbtFloatArray(transform.matrix))
							.set('start_interpolation', new NbtInt(0))
					)
				} else {
					thisFrame.set(
						node.type.charAt(0) + '_' + node.storage_name,
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
	version: SUPPORTED_MINECRAFT_VERSIONS
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

export default async function compileDataPack(
	targetVersions: SUPPORTED_MINECRAFT_VERSIONS[],
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

	if (aj.data_pack_export_mode === 'folder') {
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

		for (const [path, file] of coreFiles) {
			const relative = PathModule.join(coreDataPackFolder, path)
			globalCoreFiles.set(relative, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.coreFiles.add(relative)
		}

		for (const [path, file] of versionedFiles) {
			const relative = PathModule.join(versionedDataPackFolder, path)
			globalVersionSpecificFiles.set(relative, file)
			if (file.includeInAJMeta === false) continue
			ajmeta.versionedFiles.add(relative)
		}

		console.groupEnd()
	}

	console.log('Exported Files:', globalCoreFiles.size + globalVersionSpecificFiles.size)

	const packMetaPath = PathModule.join(options.dataPackFolder, 'pack.mcmeta')
	const packMeta = PackMeta.fromFile(packMetaPath)
	packMeta.content.pack ??= {}
	packMeta.content.pack.pack_format = getDataPackFormat(targetVersions[0])
	packMeta.content.pack.description ??= `Animated Java Data Pack for ${targetVersions.join(', ')}`

	if (targetVersions.length > 1) {
		packMeta.content.pack.supported_formats = []
		packMeta.content.overlays ??= {}
		packMeta.content.overlays.entries ??= []

		for (const version of targetVersions) {
			const format: PackMetaFormats = getDataPackFormat(version)
			packMeta.content.pack.supported_formats.push(format)

			const existingOverlay = packMeta.content.overlays.entries.find(
				e => e.directory === `animated_java_${version.replaceAll('.', '_')}`
			)
			if (!existingOverlay) {
				packMeta.content.overlays.entries.push({
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
	}

	console.timeEnd('Data Pack Compilation took')
}

async function removeFiles(ajmeta: AJMeta) {
	console.time('Removing Files took')
	const aj = Project!.animated_java
	if (aj.data_pack_export_mode === 'folder') {
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
				let content: FunctionTagJSON
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
	JsonText.defaultMinecraftVersion = version

	const aj = Project!.animated_java
	const isStatic = animations.length === 0
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
		BoneConfig,
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
		is_static: isStatic,
		getNodeTags,
		BONE_TYPES,
		project_storage: `animated_java:${aj.export_namespace}`,
		temp_storage: `animated_java:temp`,
		gu_storage: `animated_java:gu`,
		auto_update_rig_orientation: aj.auto_update_rig_orientation,
		debug_mode: debugMode,
	}

	compileMcbProject({
		sourceFiles: {
			'src/global.mcbt': mcbFiles[version].globalTemplates,
			'src/animated_java.mcb': mcbFiles[version].global,
			[`src/animated_java/${aj.export_namespace}.mcb`]: isStatic
				? mcbFiles[version].static
				: mcbFiles[version].animation,
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
	const lastNamespace = Project!.last_used_export_namespace
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
			await Promise.any(writeQueue.values())
		}
	}
	await Promise.all(writeQueue.values())

	PROGRESS_DESCRIPTION.set('Merging Function Tags...')
	MAX_PROGRESS.set(functionTagQueue.size)
	PROGRESS.set(0)
	for (const [path, file] of functionTagQueue.entries()) {
		const oldTag = DataPackTag.fromJSON(JSON.parse(fs.readFileSync(path, 'utf-8')))
		const merged = oldTag.merge(DataPackTag.fromJSON(JSON.parse(file.content.toString())))

		merged.filter(entry => {
			const id = DataPackTag.getEntryId(entry)
			const isTag = id.startsWith('#')
			const location = parseResourceLocation(isTag ? id.substring(1) : id)
			// Ignore entries unrelated to Animated Java
			if (location.namespace !== 'animated_java') return true

			// Remove last namespace entries if the namespace has changed
			if (aj.export_namespace !== lastNamespace && location.namespace === lastNamespace)
				return false

			// Search for the entry in all data folders
			const functionFolderName = projectTargetVersionIsAtLeast('1.21')
				? 'function'
				: 'functions'
			const subPath = (isTag ? 'tags/' : '') + functionFolderName
			const extension = isTag ? '.json' : '.mcfunction'

			for (const folder of fs.readdirSync(dataPackFolder)) {
				const fullPath = PathModule.join(
					dataPackFolder,
					folder,
					location.namespace,
					subPath,
					location.path + extension
				)

				if (fs.existsSync(fullPath)) return true
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

		await fs.promises.writeFile(path, autoStringify(merged.toJSON()))
		PROGRESS.set(PROGRESS.get() + 1)
	}
}
