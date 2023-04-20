import { loadUtil } from '../util'
import { Globals as G } from './globals'

function tagJsonMerger(a: any, b: any) {
	a.values = a.values.filter(v => !b.values.includes(v))
	a.values.push(...b.values)
	return a
}

export function generateNamespaceFolder() {
	const { formatStr } = AnimatedJava.API
	const { NbtCompound, NbtInt, NbtTag, NbtList, NbtString } = AnimatedJava.API.deepslate
	const { renderedAnimations, exporterSettings, rig } = G.exportData
	const { matrixToNbtFloatArray } = loadUtil()

	const namespaceFolder = G.DATA_FOLDER.newFolder(G.NAMESPACE)
	const [
		functionsFolder,
		applyVariantFolder,
		animationsFolder,
		functionTagFolder,
		entityTagFolder,
	] = namespaceFolder.newFolders(
		'functions',
		'functions/apply_variant',
		'functions/animations',
		'tags',
		'tags/functions'
	)

	G.MINECRAFT_FOLDER.newFolder('tags/functions')
		//ANCHOR - tag NAMESPACE:load
		.chainNewFile(
			'load.json',
			{
				replace: false,
				values: [`${G.AJ_NAMESPACE}:load`],
			},
			tagJsonMerger
		)
		//ANCHOR - tag NAMESPACE:tick
		.chainNewFile(
			'tick.json',
			{
				replace: false,
				values: [`${G.AJ_NAMESPACE}:tick`],
			},
			tagJsonMerger
		)

	entityTagFolder
		// ANCHOR - entity_type NAMESPACE:entity_types/aj_root
		.chainNewFile('aj_root.json', {
			replace: false,
			values: ['minecraft:item_display'],
		})
		// ANCHOR - entity_type NAMESPACE:entity_types/aj_bone
		.chainNewFile('aj_bone.json', {
			replace: false,
			values: ['minecraft:item_display'],
		})

	functionTagFolder
		// ANCHOR - tag NAMESPACE:on_summon
		.chainNewFile('on_summon.json', {
			replace: false,
			values: [],
			tagJsonMerger,
		})
		// ANCHOR - tag NAMESPACE:on_tick
		.chainNewFile('on_tick.json', {
			replace: false,
			values: [],
			tagJsonMerger,
		})
		// ANCHOR - tag NAMESPACE:on_load
		.chainNewFile('on_load.json', {
			replace: false,
			values: [`${G.AJ_NAMESPACE}:on_load`],
			tagJsonMerger,
		})
		// ANCHOR - tag NAMESPACE:on_remove
		.chainNewFile('on_remove.json', {
			replace: false,
			values: [],
			tagJsonMerger,
		})

	// ANCHOR - function NAMESPACE:uninstall
	functionsFolder.chainNewFile('uninstall.mcfunction', [
		// Scoreboard objectives
		...Object.values(G.SCOREBOARD)
			.filter(s => !s.includes('%s'))
			.map(s => `scoreboard objectives remove ${s}`),
		// prettier-ignore
		...renderedAnimations.map(a => `scoreboard objectives remove ${formatStr(G.SCOREBOARD.localAnimTime, [a.name])}`),
		// prettier-ignore
		...renderedAnimations.map(a => `scoreboard objectives remove ${formatStr(G.SCOREBOARD.loopMode, [a.name])}`),
	])
	const userRootEntityNbt = NbtTag.fromString(exporterSettings.root_entity_nbt.value)

	// Summon NBT
	let summonNbt = userRootEntityNbt.isCompound() ? userRootEntityNbt : new NbtCompound()
	const passengers = new NbtList()
	for (const [uuid, bone] of Object.entries(rig.nodeMap)) {
		const pose = rig.defaultPose.find(p => p.uuid === uuid)
		const passenger = new NbtCompound()
			.set('id', new NbtString('minecraft:item_display'))
			.set(
				'Tags',
				new NbtList([
					new NbtString(G.TAGS.new),
					new NbtString(G.TAGS.rigEntity),
					new NbtString(formatStr(G.TAGS.boneEntity)),
					new NbtString(formatStr(G.TAGS.namedBoneEntity, [bone.name])),
				])
			)
			.set('transformation', matrixToNbtFloatArray(pose.matrix))
			.set(
				'interpolation_duration',
				new NbtInt(exporterSettings.interpolation_duration.value)
			)
		if (bone.type === 'bone') {
			passenger.set(
				'item',
				new NbtCompound()
					.set('id', new NbtString(G.RIG_ITEM))
					.set('Count', new NbtInt(1))
					.set(
						'tag',
						new NbtCompound().set('CustomModelData', new NbtInt(bone.customModelData))
					)
			)
			// These values are quite extreme, Should probably figure out how to get a perfect bounding box based on model *and* animations.
			const maxHeight = Math.max(
				Math.abs(bone.boundingBox.min.y),
				Math.abs(bone.boundingBox.max.y)
			)
			const maxWidth = Math.max(
				Math.abs(bone.boundingBox.min.x),
				Math.abs(bone.boundingBox.max.x),
				Math.abs(bone.boundingBox.min.z),
				Math.abs(bone.boundingBox.max.z)
			)
			passenger.set('height', new NbtInt(maxHeight)).set('width', new NbtInt(maxWidth))

			const userBoneNbt = NbtTag.fromString(bone.nbt)
			if (userBoneNbt instanceof NbtCompound)
				userBoneNbt.forEach((key, value) => {
					passenger.set(key, value)
				})
		}
		passengers.add(passenger)
	}
	if (Object.keys(rig.nodeMap).length === 1 && renderedAnimations.length === 0) {
		summonNbt = passengers.get(0) as typeof summonNbt
	} else {
		summonNbt.set('Passengers', passengers)
	}

	const userSummonTags = summonNbt.get('Tags')
	const summonTags = userSummonTags instanceof NbtList ? userSummonTags : new NbtList()
	summonTags.add(new NbtString(G.TAGS.new))
	summonTags.add(new NbtString(G.TAGS.rigEntity))
	summonTags.add(new NbtString(G.TAGS.rootEntity))
	summonNbt.set('Tags', summonTags)

	const variantSummonFolder = functionsFolder
		// ANCHOR - function NAMESPACE:summon
		.chainNewFile('summon.mcfunction', [
			`summon minecraft:item_display ~ ~ ~ ${summonNbt.toString()}`,
			`execute as @e[type=${G.ENTITY_TYPES.ajRoot},limit=1,distance=..1,tag=${G.TAGS.rootEntity},tag=${G.TAGS.new}] run function ${G.AJ_NAMESPACE}:summon/as_root`,
		])
		.newFolder('summon')

	if (exporterSettings.include_convenience_functions.value === true) {
		for (const variant of G.VARIANTS) {
			if (variant.default) continue
			// ANCHOR - function NAMESPACE:summon/${variant.name}
			variantSummonFolder.newFile(`${variant.name}.mcfunction`, [
				`scoreboard players set #variant ${G.SCOREBOARD.i} ${G.VARIANTS.indexOf(variant)}`,
				`function ${G.NAMESPACE}:summon`,
			])
		}
	}

	functionsFolder
		.newFolder('remove')
		// ANCHOR - function NAMESPACE:remove/this
		.chainNewFile('this.mcfunction', [
			`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.AJ_NAMESPACE}:remove/as_root`,
			`execute if entity @s[tag=!${G.TAGS.rootEntity}] run tellraw @a ${formatStr(
				G.TELLRAW.errorMustBeRunAsRoot.toString(),
				[`${G.NAMESPACE}:remove/this`]
			)}`,
		])
		// ANCHOR - function NAMESPACE:remove/rigs
		.chainNewFile('rigs.mcfunction', [
			`execute as @e[type=${G.ENTITY_TYPES.ajRoot},tag=${G.TAGS.rootEntity}] run function ${G.AJ_NAMESPACE}:remove/as_root`,
		])
		// ANCHOR - function NAMESPACE:remove/all
		.chainNewFile('all.mcfunction', [`kill @e[tag=${G.TAGS.rigEntity}]`])

	for (const variant of G.VARIANTS) {
		// ANCHOR - func NAMESPACE:apply_variant/${variant.name}
		applyVariantFolder.newFile(`${variant.name}.mcfunction`, [
			`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.AJ_NAMESPACE}:apply_variant/${variant.name}_as_root`,
			`execute if entity @s[tag=!${G.TAGS.rootEntity}] run tellraw @a ${formatStr(
				G.TELLRAW.errorMustBeRunAsRoot.toString(),
				[`${G.NAMESPACE}:apply_variant/${variant.name}`]
			)}`,
		])
	}

	for (const anim of renderedAnimations) {
		const animFolder = namespaceFolder.newFolder(`functions/animations/${anim.name}`)
		for (const name of [
			'play',
			'resume',
			'pause',
			'stop',
			'apply_frame',
			'next_frame',
			'tween_play',
			'tween_resume',
		]) {
			// ANCHOR - function NAMESPACE:animations/${anim.name}/play
			// ANCHOR - function NAMESPACE:animations/${anim.name}/resume
			// ANCHOR - function NAMESPACE:animations/${anim.name}/pause
			// ANCHOR - function NAMESPACE:animations/${anim.name}/stop
			// ANCHOR - function NAMESPACE:animations/${anim.name}/apply_frame
			// ANCHOR - function NAMESPACE:animations/${anim.name}/next_frame
			// ANCHOR - function NAMESPACE:animations/${anim.name}/tween_play
			// ANCHOR - function NAMESPACE:animations/${anim.name}/tween_resume
			animFolder.newFile(`${name}.mcfunction`, [
				`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.AJ_NAMESPACE}:animations/${anim.name}/${name}_as_root`,
				`execute if entity @s[tag=!${G.TAGS.rootEntity}] run tellraw @a ${formatStr(
					G.TELLRAW.errorMustBeRunAsRoot.toString(),
					[`${G.NAMESPACE}:animations/${anim.name}/${name}`]
				)}`,
			])
		}
	}

	if (!G.IS_SINGLE_ENTITY_RIG) {
		animationsFolder
			// ANCHOR - function NAMESPACE:animations/stop_all_animations
			.chainNewFile('stop_all_animations.mcfunction', [
				`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.AJ_NAMESPACE}:animations/stop_all_animations_as_root`,
				`execute if entity @s[tag=!${G.TAGS.rootEntity}] run tellraw @a ${formatStr(
					G.TELLRAW.errorMustBeRunAsRoot.toString(),
					[`${G.NAMESPACE}:animations/stop_all_animations`]
				)}`,
			])
	}
}
