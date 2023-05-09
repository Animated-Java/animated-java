import { loadAnimationTreeGenerator } from './animationTreeGen'
import { Globals as G } from './globals'

function getExportVersionId() {
	return Math.round(Math.random() * 2 ** 31 - 1 - (Math.random() * 2 ** 31 - 1))
}

export function generateAnimatedJavaFolder() {
	const { formatStr, generateSearchTree } = AnimatedJava.API
	const { ajSettings, projectSettings, exporterSettings, renderedAnimations, rig } = G.exportData

	const internalFolder = G.DATA_FOLDER.newFolder(G.AJ_NAMESPACE)
	const [functionsFolder, applyVariantFolder, animationFunctionsFolder] =
		internalFolder.newFolders('functions', 'functions/apply_variant', 'functions/animations')

	const { buildFrameTree } = loadAnimationTreeGenerator()

	functionsFolder
		// ANCHOR - func AJ_NAMESPACE:load
		.chainNewFile('load.mcfunction', [
			// Scoreboard objectives
			...Object.values(G.SCOREBOARD)
				.filter(s => !s.includes('%s'))
				.map(s => `scoreboard objectives add ${s} dummy`),
			// prettier-ignore
			...renderedAnimations.map(a => `scoreboard objectives add ${formatStr(G.SCOREBOARD.localAnimTime, [a.name])} dummy`),
			// prettier-ignore
			...renderedAnimations.map(a => `scoreboard objectives add ${formatStr(G.SCOREBOARD.loopMode, [a.name])} dummy`),
			// prettier-ignore
			...renderedAnimations.map((a, i) => `scoreboard players set $aj.${G.NAMESPACE}.animation.${a.name} ${G.SCOREBOARD.id} ${i}`),
			// prettier-ignore
			...G.VARIANTS.map((v, i) => `scoreboard players set $aj.${G.NAMESPACE}.variant.${v.name} ${G.SCOREBOARD.id} ${i}`),
			// Variable initialization
			`scoreboard players add .aj.last_id ${G.SCOREBOARD.id} 0`,
			`scoreboard players set $aj.default_interpolation_duration ${G.SCOREBOARD.i} ${exporterSettings.interpolation_duration.value}`,
			// prettier-ignore
			...G.LOOP_MODES.map((mode, i) => `scoreboard players set $aj.loop_mode.${mode} ${G.SCOREBOARD.i} ${i}`),
			// version ID
			`scoreboard players set ${G.SCOREBOARD.exportVersion} ${
				G.SCOREBOARD.i
			} ${getExportVersionId()}`,
			// load function tag
			`scoreboard players reset * ${G.SCOREBOARD.rigLoaded}`,
			`execute as @e[type=${G.ENTITY_TYPES.ajRoot},tag=${G.TAGS.rootEntity}] run function ${G.AJ_NAMESPACE}:on_load`,
		])
		// ANCHOR - func AJ_NAMESPACE:on_load
		.chainNewFile('on_load.mcfunction', [
			`scoreboard players set @s ${G.SCOREBOARD.rigLoaded} 1`,
			G.OUTDATED_RIG_WARNING_ENABLED
				? `execute unless score @s ${G.SCOREBOARD.exportVersion} = ${G.SCOREBOARD.exportVersion} ${G.SCOREBOARD.i} at @s run function ${G.AJ_NAMESPACE}:upgrade_rig`
				: undefined,
		])
		// ANCHOR - func AJ_NAMESPACE:tick
		.chainNewFile('tick.mcfunction', [
			`execute as @e[type=${G.ENTITY_TYPES.ajRoot},tag=${G.TAGS.rootEntity}] run function ${G.AJ_NAMESPACE}:tick_as_root`,
		])
		// ANCHOR - func AJ_NAMESPACE:tick_as_root
		.chainNewFile('tick_as_root.mcfunction', [
			`execute unless score @s ${G.SCOREBOARD.rigLoaded} matches 1 run function ${G.AJ_NAMESPACE}:on_load`,
			`scoreboard players add @s ${G.SCOREBOARD.lifeTime} 1`,
			`execute at @s on passengers run tp @s ~ ~ ~ ~ ~`,
			`function #${G.NAMESPACE}:on_tick`,
			`function ${G.AJ_NAMESPACE}:animations/tick`,
		])

	functionsFolder
		.newFolder('summon')
		// ANCHOR - func AJ_NAMESPACE:summon/as_root
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
				? `execute at @s run function ${G.AJ_NAMESPACE}:summon/as_bone`
				: `execute at @s on passengers run function ${G.AJ_NAMESPACE}:summon/as_bone`,
			...G.VARIANTS.map(
				v =>
					`execute if score #variant ${G.SCOREBOARD.i} = $aj.${G.NAMESPACE}.variant.${v.name} ${G.SCOREBOARD.id} run function ${G.AJ_NAMESPACE}:apply_variant/${v.name}_as_root`
			),
			`execute if score #animation ${G.SCOREBOARD.i} matches 0.. run scoreboard players operation @s ${G.SCOREBOARD.animTime} = #frame ${G.SCOREBOARD.i}`,
			...renderedAnimations
				.map(a => [
					`execute if score #animation ${G.SCOREBOARD.i} = $aj.${G.NAMESPACE}.animation.${a.name} ${G.SCOREBOARD.id} run function ${G.AJ_NAMESPACE}:animations/${a.name}/apply_frame_as_root`,
					`execute if score #animation ${G.SCOREBOARD.i} = $aj.${G.NAMESPACE}.animation.${
						a.name
					} ${G.SCOREBOARD.id} run scoreboard players operation @s ${formatStr(
						G.SCOREBOARD.localAnimTime,
						[a.name]
					)} = #frame ${G.SCOREBOARD.i}`,
				])
				.reduce((a, b) => a.concat(b), []),
			`execute at @s run function #${G.NAMESPACE}:on_summon`,
			`tag @s remove ${G.TAGS.new}`,
			// Reset scoreboard arguemnts
			`scoreboard players reset #frame ${G.SCOREBOARD.i}`,
			`scoreboard players reset #variant ${G.SCOREBOARD.i}`,
			`scoreboard players reset #animation ${G.SCOREBOARD.i}`,
		])
		// ANCHOR - func AJ_NAMESPACE:summon/as_bone
		.chainNewFile('as_bone.mcfunction', [
			`scoreboard players operation @s ${G.SCOREBOARD.id} = .aj.last_id ${G.SCOREBOARD.id}`,
			`tag @s remove ${G.TAGS.new}`,
		])

	functionsFolder
		.newFolder('remove')
		// ANCHOR - func AJ_NAMESPACE:remove/as_root
		.chainNewFile('as_root.mcfunction', [
			`execute at @s run function #${G.NAMESPACE}:on_remove`,
			G.IS_SINGLE_ENTITY_RIG ? undefined : `execute on passengers run kill @s`,
			`kill @s`,
		])

	if (G.OUTDATED_RIG_WARNING_ENABLED) {
		// ANCHOR - func AJ_NAMESPACE:upgrade_rig
		functionsFolder.chainNewFile('upgrade_rig.mcfunction', [
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
			`tellraw @a ${G.TELLRAW.errorOutOfDateRig}`,
		])
	}

	for (const variant of G.VARIANTS) {
		// ANCHOR - func AJ_NAMESPACE:apply_variant/${variant.name}_as_root
		applyVariantFolder.newFile(`${variant.name}_as_root.mcfunction`, [
			G.IS_SINGLE_ENTITY_RIG
				? `function ${G.AJ_NAMESPACE}:apply_variant/${variant.name}_as_bone`
				: `execute on passengers run function ${G.AJ_NAMESPACE}:apply_variant/${variant.name}_as_bone`,
		])

		// ANCHOR - func AJ_NAMESPACE:apply_variant/${variant.name}_as_bone
		const commands: string[] = []
		for (const [uuid, bone] of Object.entries(rig.nodeMap)) {
			if (bone.type !== 'bone') continue
			const included = variant.affectedBones.find(v => v.value === uuid)
			if (
				(!included && variant.affectedBonesIsAWhitelist) ||
				(included && !variant.affectedBonesIsAWhitelist)
			)
				continue

			let variantBone: AnimatedJava.IRenderedBoneVariant
			if (variant.default) {
				variantBone = bone
			} else {
				variantBone = rig.variantModels[variant.name][uuid]
			}

			commands.push(
				`execute if entity @s[tag=${formatStr(G.TAGS.namedBoneEntity, [
					bone.name,
				])}] run data modify entity @s item.tag.CustomModelData set value ${
					variantBone.customModelData
				}`
			)
		}
		applyVariantFolder.newFile(`${variant.name}_as_bone.mcfunction`, commands)
	}

	if (!G.IS_SINGLE_ENTITY_RIG) {
		// ANCHOR - func AJ_NAMESPACE:animations/stop_all_animations_as_root
		animationFunctionsFolder.newFile('stop_all_animations_as_root.mcfunction', [
			...renderedAnimations.map(a => `function ${G.AJ_NAMESPACE}:animations/${a.name}/pause`),
		])

		// ANCHOR - func AJ_NAMESPACE:animations/tick
		animationFunctionsFolder.newFile('tick.mcfunction', [
			...renderedAnimations.map(
				anim =>
					`execute if entity @s[tag=${formatStr(G.TAGS.activeAnim, [
						anim.name,
					])}] run function ${G.AJ_NAMESPACE}:animations/${anim.name}/tick`
			),
		])
	}

	for (const anim of renderedAnimations) {
		const animFolder = animationFunctionsFolder
			.newFolder(`${anim.name}`)
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/play_as_root
			.chainNewFile('play_as_root.mcfunction', [
				`scoreboard players set @s ${G.SCOREBOARD.animTime} 0`,
				`scoreboard players set @s ${formatStr(G.SCOREBOARD.localAnimTime, [anim.name])} 0`,
				`scoreboard players set @s ${formatStr(G.SCOREBOARD.loopMode, [
					anim.name,
				])} ${G.LOOP_MODES.indexOf(anim.loopMode)}`,
				G.IS_SINGLE_ENTITY_RIG
					? `data modify entity @s interpolation_duration set value 0`
					: `execute on passengers run data modify entity @s interpolation_duration set value 0`,
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/tree/leaf_0`,
				G.IS_SINGLE_ENTITY_RIG
					? `execute store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`
					: `execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`,
				`tag @s add ${formatStr(G.TAGS.activeAnim, [anim.name])}`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/resume_as_root
			.chainNewFile('resume_as_root.mcfunction', [
				`scoreboard players set @s ${formatStr(G.SCOREBOARD.loopMode, [
					anim.name,
				])} ${G.LOOP_MODES.indexOf(anim.loopMode)}`,
				G.IS_SINGLE_ENTITY_RIG
					? `execute store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`
					: `execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`,
				`tag @s add ${formatStr(G.TAGS.activeAnim, [anim.name])}`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/pause_as_root
			.chainNewFile('pause_as_root.mcfunction', [
				`tag @s remove ${formatStr(G.TAGS.activeAnim, [anim.name])}`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/stop_as_root
			.chainNewFile('stop_as_root.mcfunction', [
				`scoreboard players set @s ${formatStr(G.SCOREBOARD.localAnimTime, [anim.name])} 0`,
				`tag @s remove ${formatStr(G.TAGS.activeAnim, [anim.name])}`,
				G.IS_SINGLE_ENTITY_RIG
					? `execute run data modify entity @s interpolation_duration set value 0`
					: `execute on passengers run data modify entity @s interpolation_duration set value 0`,
				`tag @s add ${G.TAGS.disableCommandKeyframes}`,
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/tree/leaf_0`,
				`tag @s remove ${G.TAGS.disableCommandKeyframes}`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/tween_play_as_root
			.chainNewFile('tween_play_as_root.mcfunction', [
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/play_as_root`,
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/tween_as_root`,
				G.IS_SINGLE_ENTITY_RIG
					? `execute if score #tween_duration ${G.SCOREBOARD.i} matches ..0 store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`
					: `execute if score #tween_duration ${G.SCOREBOARD.i} matches ..0 on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`,
				`scoreboard players reset #tween_duration ${G.SCOREBOARD.i}`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/tween_resume_as_root
			.chainNewFile('tween_resume_as_root.mcfunction', [
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/resume_as_root`,
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/tween_as_root`,
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/apply_frame_as_root`,
				G.IS_SINGLE_ENTITY_RIG
					? `execute if score #tween_duration ${G.SCOREBOARD.i} matches ..0 store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`
					: `execute if score #tween_duration ${G.SCOREBOARD.i} matches ..0 on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`,
				`scoreboard players reset #tween_duration ${G.SCOREBOARD.i}`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/tween_as_root
			.chainNewFile('tween_as_root.mcfunction', [
				`execute unless score #tween_duration ${G.SCOREBOARD.i} = #tween_duration ${G.SCOREBOARD.i} run scoreboard players operation #tween_duration ${G.SCOREBOARD.i} = $aj.default_interpolation_duration ${G.SCOREBOARD.i}`,
				`scoreboard players operation @s ${G.SCOREBOARD.tweenTime} = #tween_duration ${G.SCOREBOARD.i}`,
				G.IS_SINGLE_ENTITY_RIG
					? `execute store result entity @s interpolation_duration int 1 run scoreboard players get #tween_duration ${G.SCOREBOARD.i}`
					: `execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get #tween_duration ${G.SCOREBOARD.i}`,
				`scoreboard players remove @s ${G.SCOREBOARD.tweenTime} 1`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/tick
			.chainNewFile('tick.mcfunction', [
				`execute if score @s ${G.SCOREBOARD.tweenTime} matches 1.. run function ${G.AJ_NAMESPACE}:animations/${anim.name}/tick_tween`,
				`execute unless score @s ${G.SCOREBOARD.tweenTime} matches 1.. run function ${G.AJ_NAMESPACE}:animations/${anim.name}/tick_animation`,
				// `function ${AJ_NAMESPACE}:animations/${anim.name}/tick_animation`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/tick_tween
			.chainNewFile('tick_tween.mcfunction', [
				`scoreboard players remove @s ${G.SCOREBOARD.tweenTime} 1`,
				G.IS_SINGLE_ENTITY_RIG
					? `execute if score @s ${G.SCOREBOARD.tweenTime} matches ..0 store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`
					: `execute if score @s ${G.SCOREBOARD.tweenTime} matches ..0 on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${G.SCOREBOARD.i}`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/tick_animation
			.chainNewFile('tick_animation.mcfunction', [
				`scoreboard players add @s ${formatStr(G.SCOREBOARD.localAnimTime, [anim.name])} 1`,
				`scoreboard players operation @s ${G.SCOREBOARD.animTime} = @s ${formatStr(
					G.SCOREBOARD.localAnimTime,
					[anim.name]
				)}`,
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/apply_frame_as_root`,
				`execute if score @s ${formatStr(G.SCOREBOARD.localAnimTime, [
					anim.name,
				])} matches ${anim.duration - 1}.. run function ${G.AJ_NAMESPACE}:animations/${
					anim.name
				}/end`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/end
			.chainNewFile('end.mcfunction', [
				`execute if score @s ${formatStr(G.SCOREBOARD.loopMode, [
					anim.name,
				])} = $aj.loop_mode.loop aj.i run scoreboard players set @s ${formatStr(
					G.SCOREBOARD.localAnimTime,
					[anim.name]
				)} 0`,
				`execute if score @s ${formatStr(G.SCOREBOARD.loopMode, [
					anim.name,
				])} = $aj.loop_mode.once aj.i run function ${G.NAMESPACE}:animations/${
					anim.name
				}/stop`,
				`execute if score @s ${formatStr(G.SCOREBOARD.loopMode, [
					anim.name,
				])} = $aj.loop_mode.hold aj.i run function ${G.NAMESPACE}:animations/${
					anim.name
				}/pause`,
			])
			// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/next_frame_as_root
			.chainNewFile('next_frame_as_root.mcfunction', [
				`function ${G.AJ_NAMESPACE}:animations/${anim.name}/tick_animation`,
			])

		const tree = generateSearchTree(anim.frames, item => {
			if (item.type === 'branch') return item.items.length > 0
			if (item.type === 'leaf')
				return (
					item.item.nodes.length > 0 ||
					item.item.variant !== undefined ||
					item.item.commands !== undefined
				)
			return false
		})
		// ANCHOR - func AJ_NAMESPACE:animations/${anim.name}/tree
		animFolder.newFile(
			'apply_frame_as_root.mcfunction',
			buildFrameTree(anim, tree, animFolder.newFolder('tree'))
		)
	}
}
