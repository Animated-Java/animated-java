import { IFolders } from '../datapack'
import { MCFunction } from '../functions'
import { Globals as G, JsonText, deepslate, formatStr as f, util } from '../globals'

type NbtCompound = InstanceType<typeof deepslate.NbtCompound>
type NbtList = InstanceType<typeof deepslate.NbtList>

const { NbtCompound, NbtTag, NbtList, NbtString, NbtInt, NbtFloat } = deepslate

export function generateSummonFunction(folders: IFolders) {
	const passengers = new NbtList()

	for (const [uuid, node] of Object.entries(G.exportData.rig.nodeMap)) {
		switch (node.type) {
			case 'bone':
				passengers.add(generateBonePassenger(uuid, node))
				break
			default:
				throw new Error(`Unsupported node type '${node.type}'`)
		}
	}

	let rootEntityNbt = NbtTag.fromString(
		G.exportData.exporterSettings.root_entity_nbt.value
	) as NbtCompound

	// Single entity export mode.
	if (G.IS_SINGLE_ENTITY_RIG) {
		rootEntityNbt = passengers.get(0) as NbtCompound
	} else {
		rootEntityNbt.set('Passengers', passengers)
	}

	// Root Tags
	let rootTags = rootEntityNbt.get('Tags') as NbtList | undefined
	if (!rootTags) {
		rootTags = new NbtList()
		rootEntityNbt.set('Tags', rootTags)
	}
	rootTags.add(new NbtString(G.TAGS.new))
	rootTags.add(new NbtString(G.TAGS.rigEntity))
	rootTags.add(new NbtString(G.TAGS.globalRigRoot))
	rootTags.add(new NbtString(G.TAGS.rootEntity))

	// Custom Name
	if (!rootEntityNbt.get('CustomName')) {
		rootEntityNbt.set(
			'CustomName',
			new deepslate.NbtString(
				new JsonText([
					{ text: '[', color: 'gray' },
					{ text: 'AJ', color: 'aqua' },
					`] `,
					['', { text: `${G.PROJECT_NAME}`, color: 'light_purple' }, `.root`],
				]).toString()
			)
		)
	}

	rootEntityNbt.set('teleport_duration', new deepslate.NbtInt(1))

	new MCFunction(folders.project.functions, 'summon', [
		`summon minecraft:item_display ~ ~ ~ ${rootEntityNbt.toString()}`,
		`execute as @e[type=minecraft:item_display,distance=..0.01,tag=${G.TAGS.new},limit=1] run function ${G.INTERNAL_PATH}/summon/as_root`,
	])
}

function generateBonePassenger(uuid: string, node: AnimatedJava.IRenderedNodes['Bone']) {
	const passenger = NbtTag.fromString(node.nbt) as NbtCompound
	const defaultPose = G.exportData.rig.defaultPose.find(pose => pose.uuid === uuid)
	if (!defaultPose) throw new Error(`Failed to find default pose for bone '${uuid}'`)

	passenger.set('id', new NbtString('minecraft:item_display'))

	let tags = passenger.get('Tags') as NbtList | undefined
	if (!tags) {
		tags = new NbtList()
		passenger.set('Tags', tags)
	}
	tags.add(new NbtString(G.TAGS.new))
	tags.add(new NbtString(G.TAGS.rigEntity))
	tags.add(new NbtString(G.TAGS.boneEntity))
	tags.add(new NbtString(f(G.TAGS.namedBoneEntity, [node.name])))

	passenger
		.set('transformation', util.matrixToNbtFloatArray(defaultPose.matrix))
		.set('interpolation_duration', new NbtInt(G.DEFAULT_INTERPOLATION_DURATION))
		.set('item_display', new NbtString('head'))
		.set('teleport_duration', new NbtInt(1))

	let item = passenger.get('item') as NbtCompound | undefined
	if (!item) {
		item = new NbtCompound()
		passenger.set('item', item)
	}
	item.set('id', new NbtString(G.RIG_ITEM))
		.set('Count', new NbtInt(1))
		.set('tag', new NbtCompound().set('CustomModelData', new NbtInt(node.customModelData)))

	if (!passenger.get('CustomName')) {
		passenger.set(
			'CustomName',
			new deepslate.NbtString(
				new JsonText([
					{ text: '[', color: 'gray' },
					{ text: 'AJ', color: 'aqua' },
					`] `,
					[
						'',
						{ text: `${G.PROJECT_NAME}`, color: 'light_purple' },
						`.`,
						{ text: `bone`, color: 'white' },
						`[`,
						{ text: `${node.name}`, color: 'yellow' },
						`]`,
					],
				]).toString()
			)
		)
	}

	// FIXME - This doesn't account for animations, and it SHOULD
	const maxHeight = Math.max(Math.abs(node.boundingBox.min.y), Math.abs(node.boundingBox.max.y))
	const maxWidth = Math.max(
		Math.abs(node.boundingBox.min.x),
		Math.abs(node.boundingBox.max.x),
		Math.abs(node.boundingBox.min.z),
		Math.abs(node.boundingBox.max.z)
	)
	passenger.set('height', new NbtFloat(maxHeight)).set('width', new NbtFloat(maxWidth))

	return passenger
}
