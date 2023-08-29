import { wrapNum } from '../util'
import { type IFolders } from './datapack'
import { Globals as G, JsonText, deepslate, formatStr as f, util } from './globals'
import { loadStorageGenerator } from './storageGenerator'

type NbtCompound = InstanceType<typeof deepslate.NbtCompound>

function getExportVersionId() {
	return Math.round(Math.random() * 2 ** 31 - 1 - (Math.random() * 2 ** 31 - 1))
}

function generateBonePassenger(uuid: string, bone: AnimatedJava.IRenderedNodes['Bone']) {
	const passenger = deepslate.NbtTag.fromString(bone.nbt) as NbtCompound
	const default_pose = G.exportData.rig.defaultPose.find(pose => pose.uuid === uuid)

	passenger.set('id', new deepslate.NbtString('minecraft:item_display'))

	if (!passenger.get('Tags')) passenger.set('Tags', new deepslate.NbtList())
	const tags = passenger.get('Tags') as InstanceType<typeof deepslate.NbtList>
	tags.add(new deepslate.NbtString(G.TAGS.new))
	tags.add(new deepslate.NbtString(G.TAGS.rigEntity))
	tags.add(new deepslate.NbtString(G.TAGS.boneEntity))
	tags.add(new deepslate.NbtString(f(G.TAGS.namedBoneEntity, [bone.name])))

	passenger
		.set('transformation', util.matrixToNbtFloatArray(default_pose.matrix))
		.set('interpolation_duration', new deepslate.NbtInt(G.DEFAULT_INTERPOLATION_DURATION))
		.set('item_display', new deepslate.NbtString('head'))
		.set('teleport_duration', new deepslate.NbtInt(1))

	if (!passenger.get('item')) passenger.set('item', new deepslate.NbtCompound())
	const item = passenger.get('item') as InstanceType<typeof deepslate.NbtCompound>
	item.set('id', new deepslate.NbtString(G.RIG_ITEM))
		.set('Count', new deepslate.NbtByte(1))
		.set(
			'tag',
			new deepslate.NbtCompound().set(
				'CustomModelData',
				new deepslate.NbtInt(bone.customModelData)
			)
		)

	if (!passenger.get('CustomName'))
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
						{ text: `${bone.name}`, color: 'yellow' },
						`]`,
					],
				]).toString()
			)
		)

	// FIXME - This doesn't account for animations, and it SHOULD
	const maxHeight = Math.max(Math.abs(bone.boundingBox.min.y), Math.abs(bone.boundingBox.max.y))
	const maxWidth = Math.max(
		Math.abs(bone.boundingBox.min.x),
		Math.abs(bone.boundingBox.max.x),
		Math.abs(bone.boundingBox.min.z),
		Math.abs(bone.boundingBox.max.z)
	)
	passenger
		.set('height', new deepslate.NbtFloat(maxHeight))
		.set('width', new deepslate.NbtFloat(maxWidth))

	return passenger
}

function generateLocatorPassenger(
	uuid: string,
	locator: AnimatedJava.IRenderedNodes['Locator'],
	internalSummonFolder: AnimatedJava.VirtualFolder
) {
	const { roundToN } = AnimatedJava.API
	const passenger = new deepslate.NbtCompound()
	// const passenger = deepslate.NbtTag.fromString(locator.nbt) as NbtCompound

	passenger
		.set('id', new deepslate.NbtString('minecraft:snowball'))
		.set(
			'Tags',
			new deepslate.NbtList([
				new deepslate.NbtString(G.TAGS.new),
				new deepslate.NbtString(G.TAGS.rigEntity),
				new deepslate.NbtString(G.TAGS.locatorOrigin),
				new deepslate.NbtString(f(G.TAGS.namedLocatorOrigin, [locator.name])),
			])
		)
		.set(
			'Item',
			new deepslate.NbtCompound()
				.set('id', new deepslate.NbtString(G.RIG_ITEM))
				.set('Count', new deepslate.NbtByte(1))
				.set(
					'tag',
					new deepslate.NbtCompound().set('CustomModelData', new deepslate.NbtInt(1))
				)
		)
		.set(
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
						{ text: `locator`, color: 'white' },
						`[`,
						{ text: `${locator.name}`, color: 'yellow' },
						`]`,
					],
				]).toString()
			)
		)

	const locatorEntityNbt = deepslate.NbtTag.fromString(locator.nbt) as NbtCompound
	if (!locatorEntityNbt.get('Tags')) locatorEntityNbt.set('Tags', new deepslate.NbtList())
	const tags = locatorEntityNbt.get('Tags') as InstanceType<typeof deepslate.NbtList>

	tags.add(new deepslate.NbtString(G.TAGS.locatorEntity))
	tags.add(new deepslate.NbtString(f(G.TAGS.namedLocatorEntity, [locator.name])))
	tags.add(new deepslate.NbtString(G.TAGS.new))

	if (!locatorEntityNbt.get('CustomName'))
		locatorEntityNbt.set(
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
						{ text: `locatorEntity`, color: 'white' },
						`[`,
						{ text: `${locator.name}`, color: 'yellow' },
						`]`,
					],
				]).toString()
			)
		)

	function locatorToString(node: AnimatedJava.IAnimationNode) {
		const pos = node.pos
		const euler = new THREE.Euler().setFromQuaternion(node.rot, 'YXZ')
		const rot = new THREE.Vector3(euler.x, euler.y, euler.z).multiplyScalar(180 / Math.PI)
		return `tp @s ^${roundToN(pos.x, 100000)} ^${roundToN(pos.y, 100000)} ^${roundToN(
			pos.z,
			100000
		)} ~${roundToN(wrapNum(-rot.y - 180, -180, 180), 100000)} ~${roundToN(-rot.x, 100000)}`
	}
	internalSummonFolder
		.newFolder('locator_' + locator.name)
		// ANCHOR - function G.PROJECT_PATH/summon/locator_<locator_name>/as_origin
		.chainNewFile('as_origin.mcfunction', [
			// `say Locator Origin`,
			`summon ${locator.entity_type} ~ ~ ~ ${locatorEntityNbt.toString()}`,
			`execute as @e[type=${locator.entity_type},tag=${f(G.TAGS.namedLocatorEntity, [
				locator.name,
			])},tag=${G.TAGS.new},limit=1,distance=..1] run function ${
				G.INTERNAL_PATH
			}/summon/locator_${locator.name}/as_entity`,
			`data modify entity @s Owner set from storage animated_java Owner`,
			`data remove storage animated_java Owner`,
		])
		// ANCHOR - function G.PROJECT_PATH/summon/locator_<locator_name>/as_entity
		.chainNewFile('as_entity.mcfunction', [
			// `say Locator Entity`,
			locatorToString(G.exportData.rig.defaultPose.find(v => v.uuid === uuid)),
			`data modify storage animated_java Owner set from entity @s UUID`,
			`tag @s remove ${G.TAGS.new}`,
			`function #${G.PROJECT_PATH}/on_summon/as_locator_entities`,
		])

	return passenger
}

function generateCameraPassenger(
	uuid: string,
	camera: AnimatedJava.IRenderedNodes['Camera'],
	internalSummonFolder: AnimatedJava.VirtualFolder
) {
	const { roundToN } = AnimatedJava.API
	const passenger = deepslate.NbtTag.fromString(camera.nbt) as NbtCompound
	// const default_pose = G.exportData.rig.defaultPose.find(pose => pose.uuid === uuid)

	passenger
		.set('id', new deepslate.NbtString('minecraft:snowball'))
		.set(
			'Tags',
			new deepslate.NbtList([
				new deepslate.NbtString(G.TAGS.new),
				new deepslate.NbtString(G.TAGS.rigEntity),
				new deepslate.NbtString(G.TAGS.cameraOrigin),
				new deepslate.NbtString(f(G.TAGS.namedCameraOrigin, [camera.name])),
			])
		)
		.set(
			'Item',
			new deepslate.NbtCompound()
				.set('id', new deepslate.NbtString(G.RIG_ITEM))
				.set('Count', new deepslate.NbtByte(1))
				.set(
					'tag',
					new deepslate.NbtCompound().set('CustomModelData', new deepslate.NbtInt(1))
				)
		)
		.set(
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
						{ text: `camera`, color: 'white' },
						`[`,
						{ text: `${camera.name}`, color: 'yellow' },
						`]`,
					],
				]).toString()
			)
		)

	const cameraEntityNbt = deepslate.NbtTag.fromString(camera.nbt) as NbtCompound
	if (!cameraEntityNbt.get('Tags')) cameraEntityNbt.set('Tags', new deepslate.NbtList())
	const tags = cameraEntityNbt.get('Tags') as InstanceType<typeof deepslate.NbtList>

	tags.add(new deepslate.NbtString(G.TAGS.cameraEntity))
	tags.add(new deepslate.NbtString(f(G.TAGS.namedCameraEntity, [camera.name])))
	tags.add(new deepslate.NbtString(G.TAGS.new))

	if (!cameraEntityNbt.get('CustomName'))
		cameraEntityNbt
			.set(
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
							{ text: `cameraEntity`, color: 'white' },
							`[`,
							{ text: `${camera.name}`, color: 'yellow' },
							`]`,
						],
					]).toString()
				)
			)
			.set('teleport_duration', new deepslate.NbtInt(1))

	function cameraToString(node: AnimatedJava.IAnimationNode) {
		const pos = node.pos
		const euler = new THREE.Euler().setFromQuaternion(node.rot, 'YXZ')
		const rot = new THREE.Vector3(euler.x, euler.y, euler.z).multiplyScalar(180 / Math.PI)
		return `tp @s ^${roundToN(pos.x, 100000)} ^${roundToN(pos.y, 100000)} ^${roundToN(
			pos.z,
			100000
		)} ~${roundToN(wrapNum(-rot.y - 180, -180, 180), 100000)} ~${roundToN(-rot.x, 100000)}`
	}
	internalSummonFolder
		.newFolder('camera_' + camera.name)
		// ANCHOR - function G.PROJECT_PATH/summon/camera_<camera_name>/as_origin
		.chainNewFile('as_origin.mcfunction', [
			// `say Camera Origin`,
			`summon ${camera.entity_type} ~ ~ ~ ${cameraEntityNbt.toString()}`,
			`execute as @e[type=${camera.entity_type},tag=${f(G.TAGS.namedCameraEntity, [
				camera.name,
			])},tag=${G.TAGS.new},limit=1,distance=..1] run function ${
				G.INTERNAL_PATH
			}/summon/camera_${camera.name}/as_entity`,
			`data modify entity @s Owner set from storage animated_java Owner`,
			`data remove storage animated_java Owner`,
		])
		// ANCHOR - function G.PROJECT_PATH/summon/camera_<camera_name>/as_entity
		.chainNewFile('as_entity.mcfunction', [
			// `say Camera Entity`,
			cameraToString(G.exportData.rig.defaultPose.find(v => v.uuid === uuid)),
			`data modify storage animated_java Owner set from entity @s UUID`,
			`tag @s remove ${G.TAGS.new}`,
			`function #${G.PROJECT_PATH}/on_summon/as_camera_entities`,
		])

	return passenger
}

function generateSummonFunction(internalSummonFolder: AnimatedJava.VirtualFolder) {
	let rootNbt = deepslate.NbtTag.fromString(
		G.exportData.exporterSettings.root_entity_nbt.value
	) as NbtCompound
	const passengers = new deepslate.NbtList()

	for (const [uuid, bone] of Object.entries(G.exportData.rig.nodeMap)) {
		switch (bone.type) {
			case 'bone':
				passengers.add(generateBonePassenger(uuid, bone))
				break
			case 'locator':
				passengers.add(generateLocatorPassenger(uuid, bone, internalSummonFolder))
				break
			case 'camera':
				passengers.add(generateCameraPassenger(uuid, bone, internalSummonFolder))
				break
			default:
				// @ts-ignore
				throw new Error(`Unknown bone type: ${bone.type}`)
		}
	}

	if (passengers.length === 1 && G.exportData.renderedAnimations.length === 0) {
		rootNbt = passengers.get(0) as NbtCompound
	} else {
		rootNbt.set('Passengers', passengers)
	}

	if (!rootNbt.get('Tags')) rootNbt.set('Tags', new deepslate.NbtList())
	const tags = rootNbt.get('Tags') as InstanceType<typeof deepslate.NbtList>
	tags.add(new deepslate.NbtString(G.TAGS.new))
	tags.add(new deepslate.NbtString(G.TAGS.rigEntity))
	tags.add(new deepslate.NbtString(G.TAGS.rootEntity))
	tags.add(new deepslate.NbtString(G.TAGS.globalRigRoot))

	if (!rootNbt.get('CustomName'))
		rootNbt.set(
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
						{ text: `root`, color: 'white' },
					],
				]).toString()
			)
		)

	rootNbt.set('teleport_duration', new deepslate.NbtInt(1))

	// ANCHOR - function G.PROJECT_PATH/summon
	return [
		`summon minecraft:item_display ~ ~ ~ ${rootNbt.toString()}`,
		`execute as @e[type=minecraft:item_display,tag=${G.TAGS.rootEntity},tag=${G.TAGS.new},limit=1,distance=..0.1] run function ${G.INTERNAL_PATH}/summon/as_root`,
	]
}

export function generateFunctions(folders: IFolders) {
	const {} = AnimatedJava.API
	const { generateStorage } = loadStorageGenerator()
	const cameraCount = Object.values(G.exportData.rig.nodeMap).filter(
		v => v.type === 'camera'
	).length
	const locatorCount = Object.values(G.exportData.rig.nodeMap).filter(
		v => v.type === 'locator'
	).length

	// ------------------------
	// SECTION - Load functions
	// ------------------------

	folders.project.internalFunctions
		// ANCHOR - function G.PROJECT_PATH/load
		.chainNewFile('load.mcfunction', [
			// Scoreboard objectives
			...Object.values(G.SCOREBOARD)
				.filter(s => !s.includes('%s'))
				.map(s => `scoreboard objectives add ${s} dummy`),
			// prettier-ignore
			...G.exportData.renderedAnimations.map(a => `scoreboard objectives add ${f(G.SCOREBOARD.localAnimTime, [a.name])} dummy`),
			// prettier-ignore
			...G.exportData.renderedAnimations.map(a => `scoreboard objectives add ${f(G.SCOREBOARD.loopMode, [a.name])} dummy`),
			// prettier-ignore
			...G.exportData.renderedAnimations.map((a, i) => `scoreboard players set $aj.${G.PROJECT_NAME}.animation.${a.name} ${G.SCOREBOARD.id} ${i}`),
			// prettier-ignore
			...G.VARIANTS.map((v, i) => `scoreboard players set $aj.${G.PROJECT_NAME}.variant.${v.name} ${G.SCOREBOARD.id} ${i}`),
			// Variable initialization
			`scoreboard players add .aj.last_id ${G.SCOREBOARD.id} 0`,
			// prettier-ignore
			...G.LOOP_MODES.map((mode, i) => `scoreboard players set $aj.loop_mode.${mode} ${G.SCOREBOARD.i} ${i}`),
			// version ID
			`scoreboard players set ${G.SCOREBOARD.exportVersion} ${
				G.SCOREBOARD.i
			} ${getExportVersionId()}`,
			// load function tag
			`scoreboard players reset * ${G.SCOREBOARD.rigLoaded}`,
			`execute as @e[type=minecraft:item_display,tag=${G.TAGS.rootEntity}] run function ${G.INTERNAL_PATH}/on_load`,
			// load storage
			`data modify storage animated_java:${
				G.PROJECT_NAME
			} set value ${generateStorage().toString()}`,
		])
		// ANCHOR - func G.INTERNAL_PATH/on_load
		.chainNewFile('on_load.mcfunction', [
			`scoreboard players set @s ${G.SCOREBOARD.rigLoaded} 1`,
			G.OUTDATED_RIG_WARNING_ENABLED
				? `execute unless score @s ${G.SCOREBOARD.exportVersion} = ${G.SCOREBOARD.exportVersion} ${G.SCOREBOARD.i} at @s run function ${G.INTERNAL_PATH}/mark_outdated_rig`
				: undefined,
		])

	if (G.exportData.exporterSettings.include_uninstall_function.value === true) {
		// ANCHOR - function NAMESPACE:uninstall
		folders.project.functions.newFile('uninstall.mcfunction', [
			// Scoreboard objectives
			...Object.values(G.SCOREBOARD)
				.filter(s => !s.includes('%s'))
				.map(s => `scoreboard objectives remove ${s}`),
			// prettier-ignore
			...G.exportData.renderedAnimations.map(a => `scoreboard objectives remove ${f(G.SCOREBOARD.localAnimTime, [a.name])}`),
			// prettier-ignore
			...G.exportData.renderedAnimations.map(a => `scoreboard objectives remove ${f(G.SCOREBOARD.loopMode, [a.name])}`),
			`tellraw @a ${G.TEXT.uninstallMessage.toString()}`,
		])
	}

	if (G.OUTDATED_RIG_WARNING_ENABLED)
		folders.project.internalFunctions
			// ANCHOR - func G.INTERNAL_PATH/mark_outdated_rig
			.newFile('mark_outdated_rig.mcfunction', [
				`scoreboard players operation @s ${G.SCOREBOARD.exportVersion} = ${G.SCOREBOARD.exportVersion} ${G.SCOREBOARD.i}`,
				`data modify entity @s Glowing set value 1`,
				`data modify entity @s glow_color_override set value 16711680`,
				...(G.IS_SINGLE_ENTITY_RIG
					? [
							`data modify entity @s Glowing set value 1`,
							`data modify entity @s glow_color_override set value 16711680`,
					  ]
					: [
							`execute on passengers run data modify entity @s Glowing set value 1`,
							`execute on passengers run data modify entity @s glow_color_override set value 16711680`,
					  ]),
				`tellraw @a ${G.TEXT.errorOutOfDateRig}`,
			])

	// !SECTION

	// ------------------------
	// SECTION - Tick functions
	// ------------------------

	folders.animatedJava.functions.newFile('tick.mcfunction', [
		`execute as @e[type=minecraft:item_display,tag=${G.TAGS.globalRigRoot}] run function #animated_java:rig_tick`,
	])

	folders.project.internalFunctions
		// ANCHOR - function G.INTERNAL_FUNCTIONS/tick
		.chainNewFile('tick.mcfunction', [
			`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.INTERNAL_PATH}/tick_as_root`,
		])
		// ANCHOR - function G.INTERNAL_FUNCTIONS/tick_as_root
		.chainNewFile('tick_as_root.mcfunction', [
			`execute unless score @s ${G.SCOREBOARD.rigLoaded} = @s ${G.SCOREBOARD.rigLoaded} run function ${G.INTERNAL_PATH}/on_load`,
			`scoreboard players add @s ${G.SCOREBOARD.lifeTime} 1`,
			`execute at @s on passengers run tp @s ~ ~ ~ ~ ~`,
			`function ${G.INTERNAL_PATH}/animations/tick`,
			`function #${G.PROJECT_PATH}/on_tick/as_root`,
		])

	// !SECTION

	// --------------------------
	// SECTION - Summon Functions
	// --------------------------

	const internalSummonFolder = folders.project.internalFunctions.newFolder('summon')
	folders.project.functions.newFile(
		'summon.mcfunction',
		generateSummonFunction(internalSummonFolder)
	)

	internalSummonFolder
		// ANCHOR - function G.INTERNAL_FUNCTIONS/summon/as_root
		.chainNewFile('as_root.mcfunction', [
			// Default argument values
			`execute unless score #frame ${G.SCOREBOARD.i} = #frame ${G.SCOREBOARD.i} run scoreboard players set #frame ${G.SCOREBOARD.i} 0`,
			`execute unless score #variant ${G.SCOREBOARD.i} = #variant ${
				G.SCOREBOARD.i
			} run scoreboard players set #variant ${G.SCOREBOARD.i} ${G.VARIANTS.findIndex(
				v => v.default
			)}`,
			`execute unless score #animation ${G.SCOREBOARD.i} = #animation ${G.SCOREBOARD.i} run scoreboard players set #animation ${G.SCOREBOARD.i} -1`,

			`scoreboard players set @s ${G.SCOREBOARD.animTime} 0`,
			`scoreboard players set @s ${G.SCOREBOARD.rigLoaded} 1`,
			`scoreboard players operation @s ${G.SCOREBOARD.exportVersion} = ${G.SCOREBOARD.exportVersion} ${G.SCOREBOARD.i}`,
			`execute store result score @s ${G.SCOREBOARD.id} run scoreboard players add .aj.last_id ${G.SCOREBOARD.id} 1`,
			`tp @s ~ ~ ~ ~ ~`,
			G.IS_SINGLE_ENTITY_RIG
				? `execute at @s run function ${G.INTERNAL_PATH}/summon/as_rig_entities`
				: `execute at @s on passengers run function ${G.INTERNAL_PATH}/summon/as_rig_entities`,
			...G.VARIANTS.map(
				v =>
					`execute if score #variant ${G.SCOREBOARD.i} = $aj.${G.PROJECT_NAME}.variant.${v.name} ${G.SCOREBOARD.id} run function ${G.INTERNAL_PATH}/apply_variant/${v.name}/as_root`
			),
			`execute if score #animation ${G.SCOREBOARD.i} matches 0.. run scoreboard players operation @s ${G.SCOREBOARD.animTime} = #frame ${G.SCOREBOARD.i}`,
			...G.exportData.renderedAnimations
				.map(a => [
					`execute if score #animation ${G.SCOREBOARD.i} = $aj.${G.PROJECT_NAME}.animation.${a.name} ${G.SCOREBOARD.id} run function ${G.INTERNAL_PATH}/animations/${a.name}/apply_frame_as_root`,
					`execute if score #animation ${G.SCOREBOARD.i} = $aj.${
						G.PROJECT_NAME
					}.animation.${a.name} ${
						G.SCOREBOARD.id
					} run scoreboard players operation @s ${f(G.SCOREBOARD.localAnimTime, [
						a.name,
					])} = #frame ${G.SCOREBOARD.i}`,
				])
				.reduce((a, b) => a.concat(b), []),
			`execute at @s run function #${G.PROJECT_PATH}/on_summon/as_root`,
			`tag @s remove ${G.TAGS.new}`,
			// Reset scoreboard arguemnts
			`scoreboard players reset #frame ${G.SCOREBOARD.i}`,
			`scoreboard players reset #variant ${G.SCOREBOARD.i}`,
			`scoreboard players reset #animation ${G.SCOREBOARD.i}`,
		])
		// ANCHOR - function G.INTERNAL_FUNCTIONS/summon/as_rig_entities
		.chainNewFile('as_rig_entities.mcfunction', [
			`scoreboard players operation @s ${G.SCOREBOARD.id} = .aj.last_id ${G.SCOREBOARD.id}`,
			`tag @s remove ${G.TAGS.new}`,
			`function #${G.PROJECT_PATH}/on_summon/as_rig_entities`,
			`execute if entity @s[tag=${G.TAGS.boneEntity}] run function #${G.INTERNAL_PATH}/on_summon/as_bones`,
			locatorCount > 0
				? `execute if entity @s[tag=${G.TAGS.locatorOrigin}] run function ${G.INTERNAL_PATH}/summon/as_locator_origins`
				: undefined,
			cameraCount > 0
				? `execute if entity @s[tag=${G.TAGS.cameraOrigin}] run function ${G.INTERNAL_PATH}/summon/as_camera_origins`
				: undefined,
		])

	if (locatorCount > 0)
		internalSummonFolder
			// ANCHOR - function G.INTERNAL_FUNCTIONS/summon/as_locator_origins
			.chainNewFile('as_locator_origins.mcfunction', [
				...Object.values(G.exportData.rig.nodeMap)
					.map(locator =>
						locator.type === 'locator'
							? `execute if entity @s[tag=${f(G.TAGS.namedLocatorOrigin, [
									locator.name,
							  ])}] run function ${G.INTERNAL_PATH}/summon/locator_${
									locator.name
							  }/as_origin`
							: ''
					)
					.filter(v => v),
				`function #${G.PROJECT_PATH}/on_summon/as_locator_origins`,
			])

	if (cameraCount > 0)
		internalSummonFolder
			// ANCHOR - function G.INTERNAL_FUNCTIONS/summon/as_camera_origins
			.chainNewFile('as_camera_origins.mcfunction', [
				...Object.values(G.exportData.rig.nodeMap)
					.map(camera =>
						camera.type === 'camera'
							? `execute if entity @s[tag=${f(G.TAGS.namedCameraOrigin, [
									camera.name,
							  ])}] run function ${G.INTERNAL_PATH}/summon/camera_${
									camera.name
							  }/as_origin`
							: ''
					)
					.filter(v => v),
				`function #${G.PROJECT_PATH}/on_summon/as_camera_origins`,
			])

	// ANCHOR - function G.PROJECT_PATH/summon/<variant_name>
	if (G.exportData.exporterSettings.include_variant_summon_functions.value === true) {
		const variantSummonFolder = folders.project.functions.newFolder('summon')
		for (const variant of G.VARIANTS) {
			if (variant.default) continue
			variantSummonFolder.newFile(`${variant.name}.mcfunction`, [
				`scoreboard players set #variant ${G.SCOREBOARD.i} ${G.VARIANTS.indexOf(variant)}`,
				`function ${G.PROJECT_PATH}/summon`,
			])
		}
	}

	// !SECTION

	// ---------------------------------
	// SECTION - Apply Variant Functions
	// ---------------------------------

	if (G.exportData.exporterSettings.include_apply_variant_functions.value === true) {
		const applyVariantsFolder = folders.project.functions.newFolder('apply_variant')
		const internalApplyVariantsFolder =
			folders.project.internalFunctions.newFolder('apply_variant')
		for (const variant of G.VARIANTS) {
			// ANCHOR - function G.PROJECT_PATH/apply_variant/<variant_name>
			applyVariantsFolder.newFile(`${variant.name}.mcfunction`, [
				`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.INTERNAL_PATH}/apply_variant/${variant.name}/as_root`,
				`execute if entity @s[tag=!${G.TAGS.rootEntity}] run tellraw @a ${f(
					G.TEXT.errorMustBeRunAsRoot.toString(),
					[`${G.PROJECT_PATH}/apply_variant/${variant.name}`]
				)}`,
			])
			internalApplyVariantsFolder
				.newFolder(variant.name)
				// ANCHOR - function G.INTERNAL_PATH/apply_variant/<variant_name>/as_root
				.chainNewFile(`as_root.mcfunction`, [
					G.IS_SINGLE_ENTITY_RIG
						? `function ${G.INTERNAL_PATH}/apply_variant/${variant.name}/as_bone`
						: `execute on passengers run function ${G.INTERNAL_PATH}/apply_variant/${variant.name}/as_bone`,
				])
				// ANCHOR - function G.INTERNAL_PATH/apply_variant/<variant_name>/as_bone
				.chainNewFile(`as_bone.mcfunction`, [
					...Object.entries(G.exportData.rig.nodeMap).map(([uuid, node]) => {
						if (node.type !== 'bone') return
						const included = variant.affectedBones.find(v => v.value === uuid)
						if (!included && variant.affectedBonesIsAWhitelist) return
						if (included && !variant.affectedBonesIsAWhitelist) return

						const variantBone = variant.default
							? node
							: G.exportData.rig.variantModels[variant.name][uuid]

						return `execute if entity @s[tag=${f(G.TAGS.namedBoneEntity, [
							node.name,
						])}] run data modify entity @s item.tag.CustomModelData set value ${
							variantBone.customModelData
						}`
					}),
				])
		}
	}

	// !SECTION

	// --------------------------
	// SECTION - Remove functions
	// --------------------------

	const removeFolder = folders.project.functions
		.newFolder('remove')
		// ANCHOR - function G.PROJECT_PATH/remove/this
		.chainNewFile('this.mcfunction', [
			`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.INTERNAL_PATH}/remove/as_root`,
			`execute if entity @s[tag=!${G.TAGS.rootEntity}] run tellraw @a ${f(
				G.TEXT.errorMustBeRunAsRoot.toString(),
				[`${G.PROJECT_PATH}/remove/this`]
			)}`,
		])
	if (G.exportData.exporterSettings.include_remove_rigs_function.value === true) {
		// ANCHOR - function G.PROJECT_PATH/remove/rigs
		removeFolder.newFile('rigs.mcfunction', [
			`execute as @e[type=minecraft:item_display,tag=${G.TAGS.rootEntity}] run function ${G.INTERNAL_PATH}/remove/as_root`,
		])
	}
	if (G.exportData.exporterSettings.include_remove_all_function.value === true) {
		// ANCHOR - function G.PROJECT_PATH/remove/all
		removeFolder.newFile('all.mcfunction', [
			`execute as @e[type=minecraft:item_display,tag=${G.TAGS.rootEntity}] run function ${G.INTERNAL_PATH}/remove/as_root`,
			`kill @e[tag=${G.TAGS.rigEntity}]`,
		])
	}
	folders.project.internalFunctions
		.newFolder('remove')
		// ANCHOR - function G.INTERNAL_PATH/remove/as_root
		.newFile('as_root.mcfunction', [
			`execute at @s run function #${G.PROJECT_PATH}/on_remove/as_root`,
			G.IS_SINGLE_ENTITY_RIG ? undefined : `execute on passengers on origin run kill @s`,
			G.IS_SINGLE_ENTITY_RIG ? undefined : `execute on passengers run kill @s`,
			`kill @s`,
		])

	// !SECTION

	// -----------------------------
	// SECTION - Animation functions
	// -----------------------------

	const animationsFolder = folders.project.functions.newFolder('animations')
	const internalAnimationsFolder = folders.project.internalFunctions.newFolder('animations')

	for (const anim of G.exportData.renderedAnimations) {
		animationsFolder
			.newFolder(anim.name)
			// ANCHOR - func G.PROJECT_PATH:animations/<anim_name>/play
			.chainNewFile('play.mcfunction', [
				mustBeRootWarning(`${G.PROJECT_PATH}/animations/${anim.name}/play`),
				`scoreboard players set @s ${G.SCOREBOARD.animTime} 0`,
				`scoreboard players set @s ${f(G.SCOREBOARD.localAnimTime, [anim.name])} 0`,
				`$scoreboard players set @s ${G.SCOREBOARD.tweenTime} $(tween_time)`,
				...(G.IS_SINGLE_ENTITY_RIG
					? [
							`data modify entity @s interpolation_duration set value 0`,
							`$function ${G.PROJECT_PATH}/animations/${anim.name}/set_frame with storage animated_java:${G.PROJECT_NAME} animation.${anim.name}[$(frame)]`,
							`data modify entity @s interpolation_duration set value 1`,
					  ]
					: [
							`execute on passengers run data modify entity @s interpolation_duration set value 0`,
							`$function ${G.PROJECT_PATH}/animations/${anim.name}/set_frame with storage animated_java:${G.PROJECT_NAME} animation.${anim.name}[$(frame)]`,
							`execute on passengers run data modify entity @s interpolation_duration set value 1`,
					  ]),
				`tag @s add ${f(G.TAGS.activeAnim, [anim.name])}`,
			])
			// ANCHOR - func G.PROJECT_PATH:animations/<anim_name>/resume
			.chainNewFile('resume.mcfunction', [
				mustBeRootWarning(`${G.PROJECT_PATH}/animations/${anim.name}/resume`),
				`tag @s add ${f(G.TAGS.activeAnim, [anim.name])}`,
			])
			// ANCHOR - func G.PROJECT_PATH:animations/<anim_name>/set_frame
			.chainNewFile('set_frame.mcfunction', [
				mustBeRootWarning(`${G.PROJECT_PATH}/animations/${anim.name}/resume`),
				...(G.IS_SINGLE_ENTITY_RIG
					? [
							`data modify entity @s interpolation_duration set value 0`,
							`$function ${G.PROJECT_PATH}/animations/${anim.name}/set_frame with storage animated_java:${G.PROJECT_NAME} animation.${anim.name}[$(frame)]`,
							`data modify entity @s interpolation_duration set value 1`,
					  ]
					: [
							`execute on passengers run data modify entity @s interpolation_duration set value 0`,
							`$function ${G.PROJECT_PATH}/animations/${anim.name}/set_frame with storage animated_java:${G.PROJECT_NAME} animation.${anim.name}[$(frame)]`,
							`execute on passengers run data modify entity @s interpolation_duration set value 1`,
					  ]),
			])
			// ANCHOR - func G.PROJECT_PATH:animations/<anim_name>/next_frame
			.chainNewFile('next_frame.mcfunction', [
				mustBeRootWarning(`${G.PROJECT_PATH}/animations/${anim.name}/resume`),
				`execute store result storage animated_java:args frame int 1 run scoreboard players get @s ${G.SCOREBOARD.animTime}`,
				`$function ${G.PROJECT_PATH}/animations/${anim.name}/set_frame with storage animated_java:${G.PROJECT_NAME} animation.${anim.name}[$(frame)]`,
			])
			// ANCHOR - func G.PROJECT_PATH:animations/<anim_name>/pause
			.chainNewFile('pause.mcfunction', [
				mustBeRootWarning(`${G.PROJECT_PATH}/animations/${anim.name}/pause`),
				`tag @s remove ${f(G.TAGS.activeAnim, [anim.name])}`,
			])
			// ANCHOR - func G.PROJECT_PATH:animations/<anim_name>/stop
			.chainNewFile('stop.mcfunction', [
				mustBeRootWarning(`${G.PROJECT_PATH}/animations/${anim.name}/stop`),
				`scoreboard players set @s ${G.SCOREBOARD.animTime} 0`,
				`scoreboard players set @s ${f(G.SCOREBOARD.localAnimTime, [anim.name])} 0`,
				`tag @s add ${f(G.TAGS.disableCommandKeyframes)}`,
				...(G.IS_SINGLE_ENTITY_RIG
					? [
							`data modify entity @s interpolation_duration set value 0`,
							`$function ${G.PROJECT_PATH}/animations/${anim.name}/set_frame with storage animated_java:${G.PROJECT_NAME} animation.${anim.name}[$(frame)]`,
							`data modify entity @s interpolation_duration set value 1`,
					  ]
					: [
							`execute on passengers run data modify entity @s interpolation_duration set value 0`,
							`$function ${G.PROJECT_PATH}/animations/${anim.name}/set_frame with storage animated_java:${G.PROJECT_NAME} animation.${anim.name}[$(frame)]`,
							`execute on passengers run data modify entity @s interpolation_duration set value 1`,
					  ]),
				`tag @s remove ${f(G.TAGS.disableCommandKeyframes)}`,
				`tag @s remove ${f(G.TAGS.activeAnim, [anim.name])}`,
			])
	}

	if (
		!G.IS_SINGLE_ENTITY_RIG &&
		G.exportData.exporterSettings.include_pause_all_animations_function.value === true
	) {
		animationsFolder
			// ANCHOR - function G.PROJECT_PATH:animations/pause_all
			.chainNewFile('pause_all.mcfunction', [
				`execute if entity @s[tag=${G.TAGS.rootEntity}] run function ${G.INTERNAL_PATH}/animations/pause_all_as_root`,
				`execute if entity @s[tag=!${G.TAGS.rootEntity}] run tellraw @a ${f(
					G.TEXT.errorMustBeRunAsRoot.toString(),
					[`${G.PROJECT_PATH}/animations/pause_all`]
				)}`,
			])
		internalAnimationsFolder
			// ANCHOR - function G.INTERNAL_PATH:animations/pause_all_as_root
			.chainNewFile('pause_all_as_root.mcfunction', [
				...G.exportData.renderedAnimations.map(
					a => `function ${G.INTERNAL_PATH}/animations/${a.name}/pause_as_root`
				),
			])
	}

	// ANCHOR - function G.INTERNAL_PATH/animations/tick
	internalAnimationsFolder.newFile('tick.mcfunction', [
		...G.exportData.renderedAnimations.map(
			anim =>
				`execute if entity @s[tag=${f(G.TAGS.activeAnim, [anim.name])}] run function ${
					G.INTERNAL_PATH
				}/animations/${anim.name}/tick`
		),
	])

	// -----------------------------------
	// SECTION - Animation Tree Generation
	// -----------------------------------

	function mustBeRootWarning(functionPath: string) {
		return `execute if entity @s[tag=!${G.TAGS.rootEntity}] run return run tellraw @a ${f(
			G.TEXT.errorMustBeRunAsRoot.toString(),
			[functionPath]
		)}`
	}

	for (const anim of G.exportData.renderedAnimations) {
		internalAnimationsFolder
			.newFolder(`${anim.name}`)
			// ANCHOR - func G.INTERNAL_PATH:animations/<anim_name>/tick
			.chainNewFile('tick.mcfunction', [])
			// ANCHOR - func G.INTERNAL_PATH:animations/<anim_name>/tick_tween
			.chainNewFile('tick_tween.mcfunction', [])
			// ANCHOR - func G.INTERNAL_PATH:animations/<anim_name>/tick_animation
			.chainNewFile('tick_animation.mcfunction', [])
			// ANCHOR - func G.INTERNAL_PATH:animations/<anim_name>/end
			.chainNewFile('end.mcfunction', [])
			// ANCHOR - func G.INTERNAL_PATH:animations/<anim_name>/end_loop
			.chainNewFile('end_loop.mcfunction', [])
	}
	// !SECTION

	// !SECTION
}
