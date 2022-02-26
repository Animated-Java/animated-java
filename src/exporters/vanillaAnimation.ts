import type * as aj from '../animatedJava'

import * as fs from 'fs'
import { tl } from '../util/intl'
import { Path } from '../util/path'
import { store } from '../util/store'
import { isEqualVector, roundToN } from '../util/misc'
import { compileMC } from '../compileLangMC'
import { removeKeyGently } from '../util/misc'
import { generateTree, TreeBranch, TreeLeaf } from '../util/treeGen'
import { CustomError } from '../util/customError'
import { JsonText } from '../util/minecraft/jsonText'
import { Entities } from '../util/minecraft/entities'
import { SNBT, SNBTTag, SNBTTagType } from '../util/SNBT'
import {
	safeFunctionName,
	format,
	fixIndent,
	safeEntityTag,
} from '../util/replace'

interface vanillaAnimationExporterSettings {
	allBonesTag: string
	animatingFlagScoreboardObjective: string
	animationLoopModeScoreboardObjective: string
	boneModelDisplayTag: string
	boneType: 'aecStack' | 'armorStand'
	dataPackPath: string | undefined
	exportMode: 'vanilla' | 'mcb'
	frameScoreboardObjective: string
	idScoreboardObjective: string
	individualBoneTag: string
	internalScoreboardObjective: string
	markerArmorStands: boolean
	mcbFilePath: string | undefined
	modelTag: string
	rootEntityType: string
	rootTag: string
	rootEntityNbt: string
	mcbConfigPath: string
	autoDistance: number
	autoDistanceMovementThreshold: number
	manualDistance: number
	deduplicatePositionFrames: boolean
	deduplicateRotationFrames: boolean
}

interface MCBConfig {
	dev: boolean
	header: string
	internalScoreboard: string
	generatedDirectory: string
	rootNamespace?: string
	defaultNamespace?: string
	[index: string]: any
}

interface EntityTypes {
	bone: string
	root: string
	boneRoot: string
	boneDisplay?: string
}

interface Tags {
	model: string
	root: string
	allBones: string
	individualBone: string
	boneDisplay: string
}

interface Scoreboards {
	id: string
	internal: string
	animationFrame: string
	animatingFlag: string
	animationLoopMode: string
}

interface GeneratedDataPackFile {
	path: string
	contents: string
}

const loopModeIDs = ['once', 'hold', 'loop']

async function createMCFile(
	bones: aj.BoneObject,
	models: aj.ModelObject,
	animations: aj.Animations,
	settings: aj.GlobalSettings,
	scaleModels: aj.ScaleModels,
	variantModels: aj.VariantModels,
	variantTextureOverrides: aj.VariantTextureOverrides,
	variantTouchedModels: aj.variantTouchedModels
): Promise<{ mcFile: string; mcbConfig: MCBConfig }> {
	const ajSettings = settings.animatedJava
	const exporterSettings: vanillaAnimationExporterSettings =
		settings.vanillaAnimationExporter
	const projectName = safeFunctionName(ajSettings.projectName)

	let headYOffset = -1.813
	if (!exporterSettings.markerArmorStands) headYOffset += -0.1
	console.log(headYOffset)

	const staticAnimationUuid = store.get('staticAnimationUuid')
	const staticFrame = animations[staticAnimationUuid].frames[0].bones

	let maxDistance = 10
	if (exporterSettings.autoDistance) {
		maxDistance = roundToN(
			Object.values(animations).reduce((o, n) => {
				return Math.max(o, n.maxDistance)
			}, -Infinity) +
				exporterSettings.autoDistanceMovementThreshold +
				-headYOffset,
			1000
		)
	} else {
		// staticDistance = exporterSettings.manualDistance
		maxDistance = exporterSettings.manualDistance
	}

	animations = removeKeyGently(staticAnimationUuid, animations)
	console.log(animations)

	const FILE: string[] = []

	const scoreboards = Object.fromEntries(
		Object.entries({
			id: exporterSettings.idScoreboardObjective,
			internal: exporterSettings.internalScoreboardObjective,
			animationFrame: exporterSettings.frameScoreboardObjective,
			animatingFlag: exporterSettings.animatingFlagScoreboardObjective,
			animationLoopMode:
				exporterSettings.animationLoopModeScoreboardObjective,
		}).map(([k, v]) => [
			k,
			format(v, {
				projectName,
			}),
		])
	) as unknown as Scoreboards

	const tags = Object.fromEntries(
		Object.entries({
			model: exporterSettings.modelTag,
			root: exporterSettings.rootTag,
			allBones: exporterSettings.allBonesTag,
			individualBone: exporterSettings.individualBoneTag,
			boneDisplay: exporterSettings.boneModelDisplayTag,
		}).map(([k, v]) => [k, format(v, { projectName })])
	) as unknown as Tags

	const entityTypes: EntityTypes = {
		bone: `#${projectName}:bone_entities`,
		root: exporterSettings.rootEntityType,
		boneRoot: 'minecraft:area_effect_cloud',
		boneDisplay: 'minecraft:armor_stand',
	}

	const errorPrefixJsonText = new JsonText([
		'',
		{ text: '[ ', color: 'dark_gray' },
		{ text: 'AJ', color: 'green' },
		{ text: ' → ', color: 'light_purple' },
		{ text: 'Error ☠', color: 'red' },
		{ text: ' ]', color: 'dark_gray' },
		'\n',
	])

	const rootExeErrorJsonText = new JsonText([
		errorPrefixJsonText.toJSON(),
		{ text: '→ ', color: 'red' },
		{ text: 'The function ', color: 'gray' },
		{ text: '%functionName ', color: 'yellow' },
		{ text: 'must be', color: 'gray' },
		'\n',
		{ text: `executed as @e[tag=${tags.root}]`, color: 'light_purple' },
	]).toString()

	// prettier-ignore
	FILE.push(`
		function reset_animation_flags {
			scoreboard players set .aj.animation ${scoreboards.animatingFlag} 0
			scoreboard players set .aj.anim_loop ${scoreboards.animatingFlag} 0
			scoreboard players set .noScripts ${scoreboards.internal} 0
		}
	`)

	// prettier-ignore
	FILE.push(`
		function assert_animation_flags {
			scoreboard players add .aj.animation ${scoreboards.animatingFlag} 0
			scoreboard players add .aj.anim_loop ${scoreboards.animatingFlag} 0
			scoreboard players add .noScripts ${scoreboards.internal} 0
		}
	`)

	{
		//? Install function
		const installJsonText = new JsonText([
			{ text: '[ ', color: 'dark_gray' },
			{ text: 'AJ', color: 'aqua' },
			{ text: ' → ', color: 'gray' },
			{ text: 'Install ⊻', color: 'green' },
			{ text: ' ]', color: 'dark_gray' },
			'\n',
			{ text: 'Installed ', color: 'gray' },
			{ text: 'armor_stand', color: 'gold' },
			{ text: ' rig.', color: 'gray' },
			'\n',
			{ text: '◘ ', color: 'gray' },
			{ text: 'Included Scoreboard Objectives:', color: 'green' },
			'\n',
			{ text: '   ◘ ', color: 'gray' },
			{ text: scoreboards.internal, color: 'aqua' },
			{ text: ' (Internal)', color: 'dark_gray' },
			'\n',
			{ text: '   ◘ ', color: 'gray' },
			{ text: scoreboards.id, color: 'aqua' },
			{ text: ' (ID)', color: 'dark_gray' },
			'\n',
			{ text: '   ◘ ', color: 'gray' },
			{ text: scoreboards.animatingFlag, color: 'aqua' },
			{ text: ' (Animation Flag)', color: 'dark_gray' },
			Object.entries(animations).map(([_, animation]) => {
				return [
					'\n',
					{ text: '   ◘ ', color: 'gray' },
					{
						text: format(scoreboards.animationLoopMode, {
							animationName: animation.name,
						}),
						color: 'aqua',
					},
					{ text: ' (Loop Mode)', color: 'dark_gray' },
					'\n',
					{ text: '   ◘ ', color: 'gray' },
					{
						text: format(scoreboards.animationFrame, {
							animationName: animation.name,
						}),
						color: 'aqua',
					},
					{ text: ' (Frame)', color: 'dark_gray' },
				]
			}),
		])

		// prettier-ignore
		if (ajSettings.verbose) {
			FILE.push(`
				function install {
					scoreboard objectives add ${scoreboards.internal} dummy
					scoreboard objectives add ${scoreboards.id} dummy
					scoreboard objectives add ${scoreboards.animatingFlag} dummy
					${Object.values(animations)
						.map((v) => format(`
							scoreboard objectives add ${scoreboards.animationLoopMode} dummy
							scoreboard objectives add ${scoreboards.animationFrame} dummy
							`, { animationName: v.name }))
						.join('\n')}
					function ${projectName}:reset_animation_flags
					scoreboard players set #uninstall ${scoreboards.internal} 0
					scoreboard players set .aj.${projectName}.framerate ${scoreboards.internal} 1
					tellraw @a ${installJsonText}
				}
			`)
		} else {
			FILE.push(`
				function install {
					scoreboard objectives add ${scoreboards.internal} dummy
					scoreboard objectives add ${scoreboards.id} dummy
					scoreboard objectives add ${scoreboards.animatingFlag} dummy
					${Object.values(animations)
						.map((v) => format(`
							scoreboard objectives add ${scoreboards.animationLoopMode} dummy
							scoreboard objectives add ${scoreboards.animationFrame} dummy
							`, { animationName: v.name }))
						.join('\n')}
					function ${projectName}:reset_animation_flags
					scoreboard players set .aj.${projectName}.framerate ${scoreboards.internal} 1
				}
			`)
		}
	}

	{
		//? Uninstall Function
		const uninstallJsonText = new JsonText([
			{ text: '[ ', color: 'dark_gray' },
			{ text: 'AJ', color: 'aqua' },
			{ text: ' → ', color: 'gray' },
			{ text: 'Uninstall ⊽', color: 'red' },
			{ text: ' ]', color: 'dark_gray' },
			'\n',
			{ text: 'Uninstalled ', color: 'gray' },
			{ text: 'armor_stand', color: 'gold' },
			{ text: ' rig specific scoreboards', color: 'gray' },
			'\n',
			{ text: '◘ ', color: 'gray' },
			{ text: 'Included Scoreboard Objectives:', color: 'green' },
			'\n',
			{ text: '   ◘ ', color: 'gray' },
			{ text: scoreboards.animatingFlag, color: 'aqua' },
			{ text: ' (Animation Flag)', color: 'dark_gray' },
			Object.entries(animations).map(([_, animation]) => {
				return [
					'\n',
					{ text: '   ◘ ', color: 'gray' },
					{
						text: format(scoreboards.animationLoopMode, {
							animationName: animation.name,
						}),
						color: 'aqua',
					},
					{ text: ' (Loop Mode)', color: 'dark_gray' },
					'\n',
					{ text: '   ◘ ', color: 'gray' },
					{
						text: format(scoreboards.animationFrame, {
							animationName: animation.name,
						}),
						color: 'aqua',
					},
					{ text: ' (Frame)', color: 'dark_gray' },
				]
			}),
			'\n',
			'\n',
			{ text: '◘ ', color: 'gray' },
			{
				text: 'Would you like to uninstall all AJ scoreboard objectives unrelated to this rig as well?',
				color: 'green',
			},
			'\n',
			{
				text: '[Yes]',
				color: 'green',
				clickEvent: {
					action: 'run_command',
					value: `/function ${projectName}:uninstall/remove_aj_related`,
				},
			},
			{
				text: ' [No]',
				color: 'red',
				clickEvent: {
					action: 'run_command',
					value: `/function ${projectName}:uninstall/keep_aj_related`,
				},
			},
		])

		const uninstallAJRelated = new JsonText([
			{
				text: 'Removed AJ specific scoreboard objectives:',
				color: 'green',
			},
			'\n',
			{ text: '   ◘ ', color: 'gray' },
			{ text: scoreboards.internal, color: 'aqua' },
			{ text: ' (Internal)', color: 'dark_gray' },
			'\n',
			{ text: '   ◘ ', color: 'gray' },
			{ text: scoreboards.id, color: 'aqua' },
			{ text: ' (ID)', color: 'dark_gray' },
		])

		const keepAjRelated = new JsonText([
			{
				text: 'Keeping AJ specific scoreboard objectives.',
				color: 'green',
			},
		])

		const uninstallNotInProgress = new JsonText([
			errorPrefixJsonText.toJSON(),
			{ text: 'Uninstall not in-progress. Please run', color: 'gray' },
			'\n',
			{ text: ` function ${projectName}:uninstall`, color: 'red' },
			'\n',
			{ text: ' to start the uninstallation process.', color: 'gray' },
		])

		if (ajSettings.verbose) {
			// prettier-ignore
			FILE.push(`
				function uninstall {
					scoreboard objectives remove ${scoreboards.animatingFlag}
					${Object.values(animations)
						.map((v) => format(`
							scoreboard objectives remove ${scoreboards.animationLoopMode}
							scoreboard objectives remove ${scoreboards.animationFrame}
							`, { animationName: v.name }))
						.join('\n')}
					scoreboard players set #uninstall ${scoreboards.internal} 1
					tellraw @a ${uninstallJsonText}
				}
				dir uninstall {
					function keep_aj_related {
						execute if score #uninstall ${scoreboards.internal} matches 0 run tellraw @a ${uninstallNotInProgress}
						execute if score #uninstall ${scoreboards.internal} matches 1 run {
							scoreboard players set #uninstall ${scoreboards.internal} 0
							tellraw @a ${keepAjRelated}
						}
					}
					function remove_aj_related {
						execute if score #uninstall ${scoreboards.internal} matches 0 run tellraw @a ${uninstallNotInProgress}
						execute if score #uninstall ${scoreboards.internal} matches 1 run {
							scoreboard players set #uninstall ${scoreboards.internal} 0
							scoreboard objectives remove ${scoreboards.internal}
							scoreboard objectives remove ${scoreboards.id}
							tellraw @a ${uninstallAJRelated}
						}
					}
				}
			`)
		} else {
			// prettier-ignore
			FILE.push(`
				function uninstall {
					scoreboard objectives remove ${scoreboards.animatingFlag}
					scoreboard objectives remove ${scoreboards.internal}
					scoreboard objectives remove ${scoreboards.id}
					${Object.values(animations)
						.map((v) => format(`
							scoreboard objectives remove ${scoreboards.animationLoopMode}
							scoreboard objectives remove ${scoreboards.animationFrame}
							`, { animationName: v.name }))
						.join('\n')}
				}
			`)
		}
	}

	//? Bone Entity Type
	FILE.push(`
		entities bone_entities {
			${entityTypes.boneRoot}
			${entityTypes.boneDisplay}
		}
	`)

	//? Remove Dir
	// prettier-ignore
	FILE.push(`
		dir remove {
			function all {
				kill @e[type=${entityTypes.root},tag=${tags.model}]
				kill @e[type=${entityTypes.bone},tag=${tags.model}]
			}
			function this {
				execute (if entity @s[tag=${tags.root}] at @s) {
					scoreboard players operation # ${scoreboards.id} = @s ${scoreboards.id}
					execute as @e[type=${entityTypes.bone},tag=${tags.model},distance=..${maxDistance}] if score @s ${scoreboards.id} = # ${scoreboards.id} run kill @s
					kill @s
				} else {
					tellraw @s ${rootExeErrorJsonText.replace('%functionName', `${projectName}:remove/this`)}
				}
			}
		}
	`)

	{
		console.groupCollapsed('Summon')
		//? Summon Dir
		class Summon {
			boneName: string
			bone: aj.AnimationFrameBone
			model: aj.Model
			customModelData: number
			constructor(boneName: string, bone: aj.AnimationFrameBone) {
				this.boneName = boneName
				this.bone = bone
				this.model = models[boneName]
				this.resetCustomModelData()
				console.log(this)
				console.log(this.nbt)
				console.log(this.nbt.toString())
			}

			resetCustomModelData() {
				this.customModelData = this.model.aj.customModelData
			}

			get nbt(): SNBTTag {
				const passengerNbt = SNBT.parse(
					bones[this.boneName].nbt || '{}'
				)
				passengerNbt._merge(
					SNBT.Compound({
						id: SNBT.String(entityTypes.boneDisplay),
						Invisible: SNBT.Boolean(true),
						Marker: SNBT.Boolean(
							exporterSettings.markerArmorStands
						),
						NoGravity: SNBT.Boolean(true),
						DisabledSlots: SNBT.Int(4144959),
					})
				)
				passengerNbt.assert('Tags', SNBTTagType.LIST)
				passengerNbt.get('Tags').push(
					SNBT.String('new'),
					SNBT.String(tags.model),
					SNBT.String(tags.allBones),
					SNBT.String(
						format(tags.individualBone, {
							boneName: this.boneName,
						})
					),
					SNBT.String(tags.boneDisplay)
				)
				passengerNbt.assert('ArmorItems', SNBTTagType.LIST)
				const armorItems = passengerNbt.get('ArmorItems')
				while (armorItems.value.length < 4) {
					armorItems.push(SNBT.Compound())
				}
				armorItems.value[3]._merge(
					SNBT.Compound({
						id: SNBT.String(ajSettings.rigItem),
						Count: SNBT.Byte(1),
						tag: SNBT.Compound({
							CustomModelData: SNBT.Int(this.customModelData),
						}),
					})
				)
				passengerNbt.assert('Pose', SNBTTagType.COMPOUND)
				const rot = this.rot
				passengerNbt.set(
					'Pose.Head',
					SNBT.List([
						SNBT.Float(rot.x),
						SNBT.Float(rot.y),
						SNBT.Float(rot.z),
					])
				)

				return SNBT.Compound({
					Age: SNBT.Int(-2147483648),
					Duration: SNBT.Int(-1),
					WaitTime: SNBT.Int(-2147483648),
					Tags: SNBT.List([
						SNBT.String('new'),
						SNBT.String(tags.model),
						SNBT.String(tags.allBones),
						SNBT.String(
							format(tags.individualBone, {
								boneName: this.boneName,
							})
						),
					]),
					Passengers: SNBT.List([passengerNbt]),
				})
			}

			get rot(): { x: number; y: number; z: number } {
				return {
					x: roundToN(this.bone.rot.x, 10000),
					y: roundToN(this.bone.rot.y, 10000),
					z: roundToN(this.bone.rot.z, 10000),
				}
			}

			get pos(): { x: number; y: number; z: number } {
				return {
					x: roundToN(this.bone.pos.x, 100000),
					y: roundToN(this.bone.pos.y + headYOffset, 100000),
					z: roundToN(this.bone.pos.z, 100000),
				}
			}

			toString() {
				const pos = Object.values(this.pos)
					.map((v) => `^${v}`)
					.join(' ')
				return `summon ${entityTypes.boneRoot} ${pos} ${this.nbt}`
			}
		}

		FILE.push(`dir summon {`)

		const summons = []
		for (const [boneName, bone] of Object.entries(staticFrame)) {
			// if (!bone.export) continue
			console.log(boneName)
			const summon = new Summon(boneName, bone)
			summons.push(summon)
		}

		const rootEntityNbt = SNBT.parse(exporterSettings.rootEntityNbt)
		rootEntityNbt.assert('Tags', SNBTTagType.LIST)
		rootEntityNbt
			.get('Tags')
			.push(
				SNBT.String('new'),
				SNBT.String(tags.model),
				SNBT.String(tags.root)
			)

		for (const [variantName, variant] of Object.entries(variantModels)) {
			for (const summon of summons) {
				if (variant[summon.boneName]) {
					summon.customModelData =
						variant[summon.boneName].aj.customModelData
				} else {
					summon.resetCustomModelData()
				}
			}
			// prettier-ignore
			FILE.push(`
				function ${variantName} {
					# Summon Root Entity
					summon ${entityTypes.root} ~ ~ ~ ${rootEntityNbt}
					# Execute as summoned root
					execute as @e[type=${entityTypes.root},tag=${tags.root},tag=new,distance=..1,limit=1] rotated ~ 0 run {
						# Copy the execution position and rotation onto the root
						tp @s ~ ~ ~ ~ ~
						# Get an ID for this rig
						execute store result score @s ${scoreboards.id} run scoreboard players add .aj.last_id ${scoreboards.internal} 1
						# Execute at updated location
						execute at @s run {
							# Summon all bone entities
							${summons.map(v => v.toString()).join('\n')}
							# Update rotation and ID of bone entities to match the root entity
							execute as @e[type=${entityTypes.bone},tag=${tags.model},tag=new,distance=..${maxDistance}] positioned as @s run {
								scoreboard players operation @s ${scoreboards.id} = .aj.last_id ${scoreboards.internal}
								tp @s ~ ~ ~ ~ ~
								tag @s remove new
							}
						}
						tag @s remove new
						# Set all animation modes to configured default
						${Object.values(animations).map(animation => format(`
							scoreboard players set @s ${scoreboards.animationFrame} 0
							scoreboard players set @s ${scoreboards.animationLoopMode} ${loopModeIDs.indexOf(animation.loopMode)}
						`, { animationName: animation.name }
						)).join('\n')}
						scoreboard players set @s ${scoreboards.animatingFlag} 0
					}
					# Assert animation flags
					function ${projectName}:assert_animation_flags
				}
			`)
		}
		FILE.push(`}`)
		console.groupEnd()
	}

	if (Object.keys(variantTouchedModels).length > 0) {
		//? Set Variant Dir
		const variantBoneModifier = `data modify entity @s[tag=${tags.individualBone}] ArmorItems[-1].tag.CustomModelData set value %customModelData`

		FILE.push(`dir set_variant {`)
		for (const [variantName, variant] of Object.entries(variantModels)) {
			const thisVariantTouchedModels = {
				...variantTouchedModels,
				...variant,
			}
			const commands = Object.entries(thisVariantTouchedModels).map(
				([k, v]) =>
					format(variantBoneModifier, {
						customModelData: v.aj.customModelData,
						boneName: k,
					})
			)

			// prettier-ignore
			FILE.push(`
				function ${variantName} {
					execute (if entity @s[tag=${tags.root}] at @s) {
						scoreboard players operation .this aj.id = @s aj.id
						execute as @e[type=${entityTypes.boneDisplay},tag=${tags.allBones},distance=..${maxDistance}] if score @s aj.id = .this aj.id run {
							${commands.join('\n')}
						}
					} else {
						tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:set_variant/${variantName}`)}
					}
				}
			`)
		}

		FILE.push(`}`)
	}

	{
		//? Reset function
		const boneBaseModifier = `tp @s[tag=${tags.individualBone}] ^%x ^%y ^%z`
		const boneDisplayModifier = `data modify entity @s[tag=${tags.individualBone}] Pose.Head set value [%xf,%yf,%zf]`
		const baseModifiers: string[] = []
		const displayModifiers: string[] = []

		for (const [boneName, bone] of Object.entries(staticFrame)) {
			const baseModifier = format(boneBaseModifier, {
				boneName,
				x: roundToN(bone.pos.x, 100000),
				y: roundToN(bone.pos.y + headYOffset, 100000),
				z: roundToN(bone.pos.z, 100000),
			})
			const displayModifier = format(boneDisplayModifier, {
				boneName,
				x: roundToN(bone.rot.x, 10000),
				y: roundToN(bone.rot.y, 10000),
				z: roundToN(bone.rot.z, 10000),
			})
			baseModifiers.push(baseModifier)
			displayModifiers.push(displayModifier)
		}

		// prettier-ignore
		FILE.push(`
			# Resets the model to it's initial summon position/rotation and stops all active animations
			function reset {
				# Make sure this function has been ran as the root entity
				execute(if entity @s[tag=${tags.root}] at @s rotated ~ 0) {
					# Remove all animation tags and reset animation time
					${Object.values(animations).map(animation => format(`
						tag @s remove aj.${projectName}.anim.${animation.name}
						scoreboard players set @s ${scoreboards.animationLoopMode} ${loopModeIDs.indexOf(animation.loopMode)}
					`, { animationName: animation.name }
					)).join('\n')}

					scoreboard players operation .this ${scoreboards.id} = @s ${scoreboards.id}
					execute as @e[type=${entityTypes.boneRoot},tag=${tags.allBones},distance=..${maxDistance}] if score @s ${scoreboards.id} = .this ${scoreboards.id} run {
						${baseModifiers.join('\n')}
						execute store result score .calc ${scoreboards.internal} run data get entity @s Air
						execute store result entity @s Air short 1 run scoreboard players add .calc ${scoreboards.internal} 2
					}
					execute as @e[type=${entityTypes.boneDisplay},tag=${tags.allBones},distance=..${maxDistance}] if score @s ${scoreboards.id} = .this ${scoreboards.id} run {
						${displayModifiers.join('\n')}
						tp @s ~ ~ ~ ~ ~
					}

				# If this entity is not the root
				} else {
					tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:reset`)}
				}
			}
		`)
	}

	{
		//? Move Function
		// prettier-ignore
		FILE.push(`function move {
			# Make sure this function has been ran as the root entity
			execute(if entity @s[tag=${tags.root}] rotated ~ 0) {
				tp @s ~ ~ ~ ~ ~
				scoreboard players operation .this ${scoreboards.id} = @s ${scoreboards.id}
				${Object.values(animations).map(animation => format(`
					scoreboard players operation .this ${scoreboards.animationFrame} = @s ${scoreboards.animationFrame}
				`, { animationName: animation.name }
				)).join('\n')}

				# Split based on animation name
				scoreboard players set # ${scoreboards.internal} 0
				${Object.values(animations).map(animation => `execute if entity @s[tag=aj.${projectName}.anim.${animation.name}] run {
					scoreboard players set # ${scoreboards.internal} 1
					# Select bone entities
					execute at @s as @e[type=${entityTypes.bone},tag=${tags.allBones}] if score @s ${scoreboards.id} = .this ${scoreboards.id} run {
						# Split based on bone entity type
						execute if entity @s[type=${entityTypes.boneRoot}] run {
							# Run root animation frame tree
							function ${projectName}:animations/${animation.name}/tree/root_bone_name
							execute store result score .calc ${scoreboards.internal} run data get entity @s Air
							execute store result entity @s Air short 1 run scoreboard players add .calc ${scoreboards.internal} 2
						}
						execute if entity @s[type=${entityTypes.boneDisplay}] run tp @s ~ ~ ~ ~ ~
					}
				}`).join('\n')}
				execute if score # ${scoreboards.internal} matches 0 run {
					execute at @s as @e[type=${entityTypes.boneRoot},tag=${tags.allBones}] if score @s ${scoreboards.id} = .this ${scoreboards.id} run tp @s ~ ~ ~
					function ${projectName}:reset
				}

			# If this entity is not the root
			} else {
				tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:move`)}
			}
		}`)
	}

	{
		//? Animation Loop function
		// prettier-ignore
		FILE.push(`
			function animation_loop {
				# Schedule clock
				schedule function ${projectName}:animation_loop 1t
				# Set anim_loop active flag to true
				scoreboard players set .aj.anim_loop ${scoreboards.animatingFlag} 1
				# Reset animating flag (Used internally to check if any animations have ticked during this tick)
				scoreboard players set .aj.animation ${scoreboards.animatingFlag} 0
				# Run animations that are active on the entity
				execute as @e[type=${entityTypes.root},tag=${tags.root}] run{

					${Object.values(animations).map((animation) =>
						`execute if entity @s[tag=aj.${projectName}.anim.${animation.name}] at @s run function ${projectName}:animations/${animation.name}/next_frame`
					).join('\n')}

					scoreboard players operation @s ${scoreboards.animatingFlag} = .aj.animation ${scoreboards.animatingFlag}
				}
				# Stop the anim_loop clock if no models are animating
				execute if score .aj.animation ${scoreboards.animatingFlag} matches 0 run {
					# Stop anim_loop shedule clock
					schedule clear ${projectName}:animation_loop
					# Set anim_loop active flag to false
					scoreboard players set .aj.anim_loop ${scoreboards.animatingFlag} 0
				}
			}
		`)
	}

	{
		//? Animations
		if (!Object.keys(animations).length) {
			throw new CustomError('No Animations Error', {
				intentional: true,
				dialog: {
					id: 'animatedJava.exporters.vanillaAnimation.dialogs.errors.noAnimations',
					title: tl(
						'animatedJava.exporters.vanillaAnimation.dialogs.errors.noAnimations.title'
					),
					lines: [
						tl(
							'animatedJava.exporters.vanillaAnimation.dialogs.errors.noAnimations.body'
						),
					],
					width: 512 + 128,
					singleButton: true,
				},
			})
		}
		console.groupCollapsed('Animations')

		FILE.push(`dir animations {`)

		// TODO Frame deduplication
		for (const animation of Object.values(animations)) {
			const thisFrameObjective = format(scoreboards.animationFrame, {
				animationName: animation.name,
			})
			if (animation.frames.length <= 1) {
				throw new CustomError('Zero Length Animation Error', {
					intentional: true,
					dialog: {
						id: 'animatedJava.exporters.vanillaAnimation.dialogs.errors.zeroLengthAnimation',
						title: tl(
							'animatedJava.exporters.vanillaAnimation.dialogs.errors.zeroLengthAnimation.title'
						),
						lines: [
							tl(
								'animatedJava.exporters.vanillaAnimation.dialogs.errors.zeroLengthAnimation.body',
								{
									animationName: animation.name,
								}
							),
						],
						width: 512,
						singleButton: true,
					},
				})
			}

			let thisMaxDistance = animation.maxDistance
			if (exporterSettings.autoDistance)
				thisMaxDistance +=
					exporterSettings.autoDistanceMovementThreshold
			else thisMaxDistance = exporterSettings.manualDistance
			thisMaxDistance = roundToN(thisMaxDistance, 1000) + 0.1

			const thisAnimationLoopMode = format(
				scoreboards.animationLoopMode,
				{
					animationName: animation.name,
				}
			)

			console.log('Animation:', animation)
			const touchedBones = Object.keys(animation.frames[0].bones)
			console.log('Touched Bones:', touchedBones)

			const animationScripts: string[] = []
			for (const frame of animation.frames) {
				if (frame.scripts?.script) {
					animationScripts.push(
						`execute if score .this ${thisFrameObjective} matches ${animation.frames.indexOf(
							frame
						)} run {\n${frame.scripts.script[0]}\n}`
					)
				}
			}
			console.log('Animation Scripts:', animationScripts)

			function getPos(boneName: string, leaf: TreeLeaf) {
				let pos = leaf.item.bones[boneName].pos
				return {
					x: roundToN(pos.x, 100000),
					y: roundToN(pos.y + headYOffset, 100000),
					z: roundToN(pos.z, 100000),
				}
			}

			function getRot(boneName: string, leaf: TreeLeaf) {
				let rot = leaf.item.bones[boneName].rot
				return {
					x: roundToN(rot.x, 10000),
					y: roundToN(rot.y, 10000),
					z: roundToN(rot.z, 10000),
				}
			}

			function getScale(boneName: string, leaf: TreeLeaf) {
				let scale = leaf.item.bones[boneName].scale
				return {
					x: roundToN(scale.x, 1000),
					y: roundToN(scale.y, 1000),
					z: roundToN(scale.z, 1000),
				}
			}

			function getFrame(boneName: string, index: number) {
				const frame = animation.frames[index]
				if (!frame) return
				let pos = frame.bones[boneName].pos
				pos = {
					x: roundToN(pos.x, 100000),
					y: roundToN(pos.y + headYOffset, 100000),
					z: roundToN(pos.z, 100000),
				}

				let rot = frame.bones[boneName].rot
				rot = {
					x: roundToN(rot.x, 10000),
					y: roundToN(rot.y, 10000),
					z: roundToN(rot.z, 10000),
				}

				let scale = frame.bones[boneName].scale
				scale = {
					x: roundToN(scale.x, 1000),
					y: roundToN(scale.y, 1000),
					z: roundToN(scale.z, 1000),
				}

				return { pos, rot, scale } as aj.AnimationFrameBone
			}

			function generateBoneTrees() {
				const animationTree = generateTree(animation.frames)
				if (animationTree.type === 'leaf')
					throw new Error(
						`Invalid top-level TreeLeaf for animation ${animation.name}`
					)
				const boneTrees = Object.fromEntries(
					Object.keys(bones).map((v) => [
						v,
						{
							pos: { v: '', trimmed: false, depth: 0 },
							rot: { v: '', trimmed: false, depth: 0 },
							scale: { v: '', trimmed: false, depth: 0 },
						},
					])
				)

				for (const boneName of Object.keys(bones)) {
					interface TreeReturn {
						v: string
						trimmed: boolean
					}

					let posDepth = 0
					let rotDepth = 0
					let scaleDepth = 0

					function createPosTree(item: TreeBranch | TreeLeaf) {
						switch (item.type) {
							case 'branch':
								posDepth++
								// prettier-ignore
								return `execute if score .this ${thisFrameObjective} matches ${item.min}..${item.max - 1} run {
									name tree/${boneName}_pos_${item.min}-${item.max - 1}
									${item.items.map((v: any) => createPosTree(v)).join('\n')}
								}`
							case 'leaf':
								const pos = getPos(boneName, item)
								return `execute if score .this ${thisFrameObjective} matches ${item.index} run tp @s ^${pos.x} ^${pos.y} ^${pos.z} ~ ~`
						}
					}

					let lastPos = { x: NaN, y: NaN, z: NaN }
					function createDeduplicatedPosTree(
						item: TreeBranch | TreeLeaf
					): TreeReturn {
						switch (item.type) {
							case 'branch':
								const inside: TreeReturn[] = item.items
									.map((v: any) =>
										createDeduplicatedPosTree(v)
									)
									.filter((v) => !v.trimmed)
								if (inside.length == 0) {
									return { v: '', trimmed: true }
								} else if (inside.length == 1) {
									posDepth++
									return inside[0]
								}
								// prettier-ignore
								posDepth++
								return {
									v: `execute if score .this ${
										thisFrameObjective
									} matches ${item.min}..${item.max - 1} run {
										name tree/${boneName}_pos_${item.min}-${item.max - 1}
										${inside.reduce((p, c) => p + (c.v ? c.v + '\n' : ''), '')}
									}`,
									trimmed: false,
								}
							case 'leaf':
								const pos = getPos(boneName, item)
								const nextFrame = getFrame(
									boneName,
									item.index + 1
								)
								if (isEqualVector(pos, lastPos)) {
									// Ignore deduplication if next frame is different value
									if (
										nextFrame &&
										isEqualVector(pos, nextFrame.pos)
									)
										return { v: '', trimmed: true }
								}
								lastPos = pos
								return {
									v: `execute if score .this ${thisFrameObjective} matches ${item.index} run tp @s ^${pos.x} ^${pos.y} ^${pos.z} ~ ~`,
									trimmed: false,
								}
						}
					}

					function createRotTree(item: TreeBranch | TreeLeaf) {
						switch (item.type) {
							case 'branch':
								rotDepth++
								// prettier-ignore
								return `execute if score .this ${thisFrameObjective} matches ${item.min}..${item.max - 1} run {
									name tree/${boneName}_rot_${item.min}-${item.max - 1}
									${item.items.map((v: any) => createRotTree(v)).join('\n')}
								}`
							case 'leaf':
								const rot = getRot(boneName, item)
								return `execute if score .this ${thisFrameObjective} matches ${item.index} run data modify entity @s Pose.Head set value [${rot.x}f,${rot.y}f,${rot.z}f]`
						}
					}

					let lastRot = { x: NaN, y: NaN, z: NaN }
					function createDeduplicatedRotTree(
						item: TreeBranch | TreeLeaf
					): TreeReturn {
						switch (item.type) {
							case 'branch':
								const inside: TreeReturn[] = item.items
									.map((v: any) =>
										createDeduplicatedRotTree(v)
									)
									.filter((v) => !v.trimmed)
								if (inside.length == 0) {
									return { v: '', trimmed: true }
								} else if (inside.length == 1) {
									rotDepth++
									return inside[0]
								}
								// prettier-ignore
								rotDepth++
								return {
									v: `execute if score .this ${
										thisFrameObjective
									} matches ${item.min}..${item.max - 1} run {
										name tree/${boneName}_rot_${item.min}-${item.max - 1}
										${inside.reduce((p, c) => p + (c.v ? c.v + '\n' : ''), '')}
									}`,
									trimmed: false,
								}
							case 'leaf':
								const rot = getRot(boneName, item)
								const nextFrame = getFrame(
									boneName,
									item.index + 1
								)
								if (isEqualVector(rot, lastRot)) {
									// Ignore deduplication if next frame is different value
									if (
										nextFrame &&
										isEqualVector(rot, nextFrame.rot)
									)
										return { v: '', trimmed: true }
								}
								lastRot = rot
								return {
									v: `execute if score .this ${thisFrameObjective} matches ${item.index} run data modify entity @s Pose.Head set value [${rot.x}f,${rot.y}f,${rot.z}f]`,
									trimmed: false,
								}
						}
					}

					let lastScale = { x: NaN, y: NaN, z: NaN }
					function createDeduplicatedScaleTree(
						item: TreeBranch | TreeLeaf,
						variant: aj.ScaleModels
					): TreeReturn {
						switch (item.type) {
							case 'branch':
								const inside: TreeReturn[] = item.items
									.map((v: any) =>
										createDeduplicatedScaleTree(v, variant)
									)
									.filter((v) => !v.trimmed)
								if (inside.length == 0) {
									return { v: '', trimmed: true }
								} else if (inside.length == 1) {
									scaleDepth++
									return inside[0]
								}
								// prettier-ignore
								scaleDepth++
								return {
									v: `execute if score .this ${
										thisFrameObjective
									} matches ${item.min}..${item.max - 1} run {
										name tree/${boneName}_scale_${item.min}-${item.max - 1}
										${inside.reduce((p, c) => p + (c.v ? c.v + '\n' : ''), '')}
									}`,
									trimmed: false,
								}
							case 'leaf':
								const scale = getScale(boneName, item)
								const nextFrame = getFrame(
									boneName,
									item.index + 1
								)
								if (isEqualVector(scale, lastScale)) {
									// Ignore deduplication if next frame is different value
									if (
										nextFrame &&
										isEqualVector(scale, nextFrame.scale)
									)
										return { v: '', trimmed: true }
								}
								lastScale = scale

								const vecStr = `${scale.x}-${scale.y}-${scale.z}`
								const customModelData =
									scaleModels[boneName][vecStr].aj
										.customModelData
								// TODO Add support for variants to scaling
								return {
									v: `execute if score .this ${thisFrameObjective} matches ${item.index} run data modify entity @s ArmorItems[-1].tag.CustomModelData set value ${customModelData}`,
									trimmed: false,
								}
						}
					}

					// prettier-ignore
					boneTrees[boneName].pos =
						exporterSettings.deduplicatePositionFrames
							? {...createDeduplicatedPosTree(animationTree), depth: posDepth }
							: { v: createPosTree(animationTree), trimmed: false, depth: posDepth }
					// prettier-ignore
					boneTrees[boneName].rot =
						exporterSettings.deduplicateRotationFrames
							? {...createDeduplicatedRotTree(animationTree), depth: rotDepth }
							: { v: createRotTree(animationTree), trimmed: false, depth: rotDepth }
					// prettier-ignore
					if (scaleModels[boneName])
						boneTrees[boneName].scale =
							{...createDeduplicatedScaleTree(animationTree, scaleModels), depth: scaleDepth }
				}
				return boneTrees
			}

			const boneTrees = generateBoneTrees()
			console.groupCollapsed('Bone Tree')
			console.log(boneTrees)
			console.groupEnd()

			FILE.push(`dir ${animation.name} {`)
			// prettier-ignore
			FILE.push(`# Starts the animation from the first frame
				function play {
					# Make sure this function has been ran as the root entity
					execute(if entity @s[tag=${tags.root}] at @s) {
						# Add animation tag
						tag @s add aj.${projectName}.anim.${animation.name}
						# Reset animation time
						execute if score .aj.${projectName}.framerate aj.i matches ..-1 run scoreboard players set @s ${thisFrameObjective} ${animation.frames.length}
						execute if score .aj.${projectName}.framerate aj.i matches 1.. run scoreboard players set @s ${thisFrameObjective} 0
						# Assert that .noScripts is tracked properly
						scoreboard players add .noScripts ${scoreboards.internal} 0
						# Start the animation loop if not running
						execute if score .aj.anim_loop ${scoreboards.animatingFlag} matches 0 run function ${projectName}:animation_loop
					# If this entity is not the root
					} else {
						tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:animations/${animation.name}/play`)}
					}
				}`
			)
			// prettier-ignore
			FILE.push(`# Stops the animation and resets to first frame
				function stop {
					# Make sure this function has been ran as the root entity
					execute(if entity @s[tag=${tags.root}] at @s) {
						# Add animation tag
						tag @s remove aj.${projectName}.anim.${animation.name}
						# Reset animation time
						scoreboard players set @s ${thisFrameObjective} 0
						# load initial animation frame without running scripts
						scoreboard players operation .oldValue ${scoreboards.internal} = .noScripts ${scoreboards.internal}
						scoreboard players set .noScripts ${scoreboards.internal} 1
						function ${projectName}:animations/${animation.name}/next_frame
						scoreboard players operation .noScripts ${scoreboards.internal} = .oldValue ${scoreboards.internal}
						# Reset animation time
						scoreboard players set @s ${thisFrameObjective} 0
					# If this entity is not the root
					} else {
						tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:animations/${animation.name}/stop`)}
					}
				}`
			)

			// prettier-ignore
			FILE.push(`# Pauses the animation on the current frame
				function pause {
					# Make sure this function has been ran as the root entity
					execute(if entity @s[tag=${tags.root}] at @s) {
						# Remove animation tag
						tag @s remove aj.${projectName}.anim.${animation.name}
					# If this entity is not the root
					} else {
						tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:animations/${animation.name}/pause`)}
					}
				}`
			)

			// prettier-ignore
			FILE.push(`# Resumes the animation from the current frame
				function resume {
					# Make sure this function has been ran as the root entity
					execute(if entity @s[tag=${tags.root}]) {
						# Remove animation tag
						tag @s add aj.${projectName}.anim.${animation.name}
						# Start the animation loop
						execute if score .aj.anim_loop ${scoreboards.animatingFlag} matches 0 run function ${projectName}:animation_loop
					# If this entity is not the root
					} else {
						tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:animations/${animation.name}/resume`)}
					}
				}`
			)

			// prettier-ignore
			FILE.push(`# Plays the next frame in the animation
				function next_frame {
					scoreboard players operation .this ${scoreboards.id} = @s ${scoreboards.id}
					scoreboard players operation .this ${thisFrameObjective} = @s ${thisFrameObjective}
					execute rotated ~ 0 as @e[type=${entityTypes.bone},tag=${tags.allBones},distance=..${thisMaxDistance}] if score @s ${scoreboards.id} = .this ${scoreboards.id} run {
						name tree/trunk
						# Bone Roots
						execute if entity @s[type=${entityTypes.boneRoot}] run {
							name tree/root_bone_name
							# Position
							${Object.entries(boneTrees).map(([boneName,trees]) => {
								// Remove trimmed bone trees
								if (trees.pos.trimmed || !trees.pos.depth) return ''
								return `execute if entity @s[tag=${format(tags.individualBone, {boneName})}] run {
									name tree/${boneName}_pos_top
									${trees.pos.v}
								}`
							}
							).join('\n')}
							execute store result entity @s Air short 1 run scoreboard players get .this ${thisFrameObjective}
						}
						# Bone Displays
						execute if entity @s[type=${entityTypes.boneDisplay}] run {
							name tree/display_bone_name
							# Rotation
							${Object.entries(boneTrees).map(([boneName,trees]) => {
								// Remove trimmed bone trees
								if (trees.rot.trimmed || !trees.rot.depth) return ''
								return `execute if entity @s[tag=${format(tags.individualBone, {boneName})}] run {
									name tree/${boneName}_rot_top
									${trees.rot.v}
								}`
							}).join('\n')}
							# Scaling
							${Object.entries(boneTrees).map(([boneName,trees]) => {
								// Remove trimmed bone trees
								if (trees.scale.trimmed || !trees.scale.depth) return ''
								return `execute if entity @s[tag=${format(tags.individualBone, {boneName})}] run {
									name tree/${boneName}_scale_top
									${trees.scale.v}
								}`
							}).join('\n')}
							# Make sure rotation stays aligned with root entity
							execute positioned as @s run tp @s ~ ~ ~ ~ ~
						}
					}

					${animationScripts.length > 0 ? `
						# Play scripts as root entity if scripts enabled
						execute if score .noScripts ${scoreboards.internal} matches 0 run {
							${animationScripts.join('\n')}
						}
					` : ''}

					# Increment frame
					scoreboard players operation @s ${thisFrameObjective} += .aj.${projectName}.framerate ${scoreboards.internal}
					# Let the anim_loop know we're still running
					scoreboard players set .aj.animation ${scoreboards.animatingFlag} 1
					# If (the next frame is the end of the animation) perform the necessary actions for the loop mode of the animation
					execute if score .aj.${projectName}.framerate aj.i matches 1.. if score @s ${thisFrameObjective} matches ${animation.frames.length}.. run function ${projectName}:animations/${animation.name}/edge
					execute if score .aj.${projectName}.framerate aj.i matches ..0 if score @s ${thisFrameObjective} matches ..-1 run function ${projectName}:animations/${animation.name}/edge
					# execute unless score @s ${thisFrameObjective} matches 0..${animation.frames.length-1} run function ${projectName}:animations/${animation.name}/edge
				}`
			)

			// prettier-ignore
			FILE.push(`# Performs a loop mode action depending on what the animation's configured loop mode is
				function edge {
					# Play Once
					execute if score @s ${thisAnimationLoopMode} matches 0 run function ${projectName}:animations/${animation.name}/stop
					# Hold on last frame
					execute if score @s ${thisAnimationLoopMode} matches 1 run function ${projectName}:animations/${animation.name}/pause
					# loop
					execute if score @s ${thisAnimationLoopMode} matches 2 run {
						execute (if score @s ${thisFrameObjective} matches ..1) {
							scoreboard players set @s ${thisFrameObjective} ${animation.frames.length}
						} else {
							scoreboard players set @s ${thisFrameObjective} 0
						}
					}
				}
			`)

			FILE.push(`}`)
		}

		FILE.push(`}`)
		console.groupEnd()
	}

	const mcbConfig: MCBConfig = {
		dev: false,
		header: '#Project generated by Animated Java (https://animated-java.dev/)',
		internalScoreboard: scoreboards.internal,
		generatedDirectory: 'zzz',
	}

	return { mcFile: fixIndent(FILE), mcbConfig }
}

async function exportMCFile(
	generated: { mcFile: string; mcbConfig: MCBConfig },
	ajSettings: aj.GlobalSettings,
	exporterSettings: vanillaAnimationExporterSettings
) {
	if (!exporterSettings.mcbFilePath) {
		throw new CustomError(
			'animatedJava.exporters.generic.dialogs.errors.mcbFilePathNotDefined',
			{
				intentional: true,
				dialog: {
					id: 'animatedJava.exporters.generic.dialogs.errors.mcbFilePathNotDefined',
					title: tl(
						'animatedJava.exporters.generic.dialogs.errors.mcbFilePathNotDefined.title'
					),
					lines: [
						tl(
							'animatedJava.exporters.generic.dialogs.errors.mcbFilePathNotDefined.body'
						),
					],
					width: 512,
					singleButton: true,
				},
			}
		)
	}

	if (exporterSettings.mcbConfigPath) {
		Blockbench.writeFile(exporterSettings.mcbConfigPath, {
			content: JSON.stringify(generated.mcbConfig),
			custom_writer: null,
		})
	}
	Blockbench.writeFile(exporterSettings.mcbFilePath, {
		content: generated.mcFile,
		custom_writer: null,
	})
}

async function exportDataPack(
	generated: { mcFile: string; mcbConfig: MCBConfig },
	ajSettings: aj.GlobalSettings,
	exporterSettings: vanillaAnimationExporterSettings
) {
	if (!exporterSettings.dataPackPath) {
		console.log(exporterSettings.dataPackPath)
		throw new CustomError(
			'animatedJava.exporters.generic.dialogs.errors.dataPackPathNotDefined.title',
			{
				intentional: true,
				dialog: {
					id: 'animatedJava.exporters.generic.dialogs.errors.dataPackPathNotDefined',
					title: tl(
						'animatedJava.exporters.generic.dialogs.errors.dataPackPathNotDefined.title'
					),
					lines: [
						tl(
							'animatedJava.exporters.generic.dialogs.errors.dataPackPathNotDefined.body'
						),
					],
					width: 512,
					singleButton: true,
				},
			}
		)
	}
	console.log('mcFile:', generated.mcFile)
	console.log('mcbConfig:', generated.mcbConfig)
	if (exporterSettings) {
		Blockbench.writeFile(exporterSettings.mcbConfigPath, {
			content: JSON.stringify(generated.mcbConfig),
			custom_writer: null,
		})
	}

	function onMessage(message: {
		type: 'progress' | 'EVT' | 'ERR' | 'INF' | 'TSK'
		msg?: string
		total?: number
		current?: number
		percent?: number
		token?: any
	}) {
		if (message.type === 'progress') {
			Blockbench.setProgress(message.percent, 50)
			Blockbench.setStatusBarText(
				format(
					tl(
						'animatedJava.exporters.generic.progress.exportingDataPack'
					),
					{
						progress: (message.percent * 100).toPrecision(4),
					}
				)
			)
		}
	}

	const dataPack: GeneratedDataPackFile[] = await compileMC(
		ajSettings.animatedJava.projectName,
		generated.mcFile,
		generated.mcbConfig,
		onMessage
	)
	let fileQueue = []

	Blockbench.setProgress(0, 0)
	Blockbench.setStatusBarText()

	dataPack.push({
		path: 'pack.mcmeta',
		contents: JSON.stringify({
			pack: {
				description: `Animated Java Rig generated data pack. Project Name: ${ajSettings.animatedJava.projectName}`,
				pack_format: 8,
			},
		}),
	})

	const dataPackPath = exporterSettings.dataPackPath
	const totalFiles = dataPack.length
	const tldMessage = tl('animatedJava.exporters.generic.writingDataPack')
	const createdPaths = new Set()

	let timeOut = false

	function setProgress(cur: number, max: number, fileName: string) {
		if (!timeOut) {
			Blockbench.setProgress(cur / max, 50)
			Blockbench.setStatusBarText(
				format(tldMessage, {
					progress: ((cur / max) * 100).toPrecision(4),
					fileName,
				})
			)
			timeOut = true
			setTimeout(() => (timeOut = false), 50)
		}
	}

	function newWriteFilePromise(
		file: GeneratedDataPackFile,
		que: Promise<unknown>[]
	) {
		const filePath = new Path(dataPackPath, file.path)

		if (!createdPaths.has(filePath.parse().dir)) {
			filePath.mkdir({ recursive: true })
			createdPaths.add(filePath.parse().dir)
		}
		const p = fs.promises
			.writeFile(filePath.path, file.contents)
			.then(() => {
				que.splice(que.indexOf(p), 1)
				setProgress(totalFiles - dataPack.length, totalFiles, file.path)
			})
		que.push(p)
	}

	const threadPoolSize = 16
	while (dataPack.length) {
		const file = dataPack.pop()
		if (fileQueue.length < threadPoolSize) {
			newWriteFilePromise(file, fileQueue)
		} else {
			await Promise.race(fileQueue)
			newWriteFilePromise(file, fileQueue)
		}
	}

	await Promise.all(fileQueue)

	Blockbench.setProgress(0, 0)
	Blockbench.setStatusBarText()
}

async function animationExport(data: any) {
	const exporterSettings: vanillaAnimationExporterSettings =
		data.settings.vanillaAnimationExporter
	const generated = await createMCFile(
		data.bones,
		data.models,
		data.animations,
		data.settings,
		data.scaleModels,
		data.variantModels,
		data.variantTextureOverrides,
		data.variantTouchedModels
	)
	console.log('mcFile:', generated.mcFile)

	switch (exporterSettings.exportMode) {
		case 'mcb':
			await exportMCFile(generated, data.settings, exporterSettings)
			break
		case 'vanilla':
			await exportDataPack(generated, data.settings, exporterSettings)
			break
	}

	Blockbench.showQuickMessage(tl('animatedJava.popups.successfullyExported'))
}

const genericEmptySettingText = tl(
	'animatedJava.settings.generic.errors.emptyValue'
)

function validateFormattedStringSetting(required: string[]) {
	return (d: aj.SettingDescriptor) => {
		if (d.value === '') {
			d.isValid = false
			d.error = genericEmptySettingText
			return d
		}
		if (required.length) {
			const notFound = required.find((v: string) => !d.value.includes(v))
			if (notFound) {
				d.isValid = false
				d.error = format(
					tl(
						'animatedJava.settings.generic.errors.missingFormatString'
					),
					{
						notFound,
					}
				)
				return d
			}
		}
		const formattedValue = format(
			d.value,
			Object.fromEntries(
				required.map((v) => [v.replace('%', ''), 'replaced'])
			)
		)
		if (formattedValue !== safeEntityTag(formattedValue)) {
			d.isValid = false
			d.error = tl(
				'animatedJava.settings.generic.errors.invalidEntityTag'
			)
		}
		return d
	}
}

const Exporter = (AJ: any) => {
	AJ.settings.registerPluginSettings(
		'animatedJava.exporters.vanillaAnimation', // Exporter ID
		'vanillaAnimationExporter', // Exporter Settings Key
		{
			rootEntityType: {
				title: tl(
					'animatedJava.exporters.generic.settings.rootEntityType.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.rootEntityType.description'
				),
				type: 'text',
				default: 'minecraft:marker',
				onUpdate(d: aj.SettingDescriptor) {
					if (d.value != '') {
						if (!Entities.isEntity(d.value)) {
							d.isValid = false
							d.error = tl(
								'animatedJava.exporters.generic.settings.rootEntityType.errors.invalidEntity'
							)
						}
					} else {
						d.isValid = false
						d.error = genericEmptySettingText
					}

					return d
				},
			},
			rootEntityNbt: {
				title: tl(
					'animatedJava.exporters.generic.settings.rootEntityNbt.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.rootEntityNbt.description'
				),
				type: 'text',
				default: '{}',
				onUpdate(d: aj.SettingDescriptor) {
					if (d.value != '') {
						try {
							SNBT.parse(d.value)
						} catch (e) {
							d.isValid = false
							d.error = tl(
								'animatedJava.exporters.generic.settings.rootEntityNbt.errors.invalidNbt',
								{
									error: e.message,
								}
							)
						}
					} else {
						d.isValid = false
						d.error = genericEmptySettingText
					}
					return d
				},
			},
			markerArmorStands: {
				title: tl(
					'animatedJava.exporters.generic.settings.markerArmorStands.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.markerArmorStands.description'
				),
				type: 'checkbox',
				default: true,
				onUpdate(d: aj.SettingDescriptor) {
					return d
				},
			},
			autoDistance: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.autoDistance.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.autoDistance.description'
				),
				type: 'checkbox',
				default: true,
				onUpdate(d: aj.SettingDescriptor) {
					return d
				},
			},
			autoDistanceMovementThreshold: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.autoDistanceMovementThreshold.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.autoDistanceMovementThreshold.description'
				),
				type: 'number',
				default: 1,
				onUpdate(d: aj.SettingDescriptor) {
					if (!(d.value >= 0)) {
						d.isValid = false
						d.error = tl(
							'animatedJava.exporters.vanillaAnimation.settings.autoDistanceMovementThreshold.errors.valueOutOfRange'
						)
					}
					return d
				},
				isVisible(settings: any) {
					return settings.vanillaAnimationExporter.autoDistance
				},
				dependencies: ['vanillaAnimationExporter.autoDistance'],
			},
			manualDistance: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.manualDistance.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.manualDistance.description'
				),
				type: 'number',
				default: 10,
				onUpdate(d: aj.SettingDescriptor) {
					if (!(d.value >= 0)) {
						d.isValid = false
						d.error = tl(
							'animatedJava.exporters.vanillaAnimation.settings.manualDistance.errors.valueOutOfRange'
						)
					}
					return d
				},
				isVisible(settings: any) {
					return !settings.vanillaAnimationExporter.autoDistance
				},
				dependencies: ['vanillaAnimationExporter.autoDistance'],
			},
			deduplicatePositionFrames: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.deduplicatePositionFrames.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.deduplicatePositionFrames.description'
				),
				type: 'checkbox',
				default: false,
				onUpdate(d: aj.SettingDescriptor) {
					return d
				},
			},
			deduplicateRotationFrames: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.deduplicateRotationFrames.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.deduplicateRotationFrames.description'
				),
				type: 'checkbox',
				default: true,
				onUpdate(d: aj.SettingDescriptor) {
					return d
				},
			},
			modelTag: {
				title: tl(
					'animatedJava.exporters.generic.settings.modelTag.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.modelTag.description'
				),
				type: 'text',
				default: 'aj.%projectName',
				onUpdate: validateFormattedStringSetting(['%projectName']),
				isResetable: true,
				groupName:
					'animatedJava.exporters.generic.settingGroups.entityTags.title',
				group: 'entityTags',
			},
			rootTag: {
				title: tl(
					'animatedJava.exporters.generic.settings.rootTag.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.rootTag.description'
				),
				type: 'text',
				default: 'aj.%projectName.root',
				onUpdate: validateFormattedStringSetting(['%projectName']),
				isResetable: true,
				group: 'entityTags',
			},
			allBonesTag: {
				title: tl(
					'animatedJava.exporters.generic.settings.allBonesTag.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.allBonesTag.description'
				),
				type: 'text',
				default: 'aj.%projectName.bone',
				onUpdate: validateFormattedStringSetting(['%projectName']),
				isResetable: true,
				group: 'entityTags',
			},
			boneModelDisplayTag: {
				title: tl(
					'animatedJava.exporters.generic.settings.boneModelDisplayTag.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.boneModelDisplayTag.description'
				),
				type: 'text',
				default: 'aj.%projectName.bone_display',
				onUpdate: validateFormattedStringSetting(['%projectName']),
				isResetable: true,
				group: 'entityTags',
			},
			individualBoneTag: {
				title: tl(
					'animatedJava.exporters.generic.settings.individualBoneTag.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.individualBoneTag.description'
				),
				type: 'text',
				default: 'aj.%projectName.bone.%boneName',
				onUpdate: validateFormattedStringSetting([
					'%projectName',
					'%boneName',
				]),
				isResetable: true,
				group: 'entityTags',
			},
			internalScoreboardObjective: {
				title: tl(
					'animatedJava.exporters.generic.settings.internalScoreboardObjective.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.internalScoreboardObjective.description'
				),
				type: 'text',
				default: 'aj.i',
				onUpdate(d: aj.SettingDescriptor) {
					if (d.value === '') {
						d.isValid = false
						d.error = genericEmptySettingText
					}
					return d
				},
				groupName:
					'animatedJava.exporters.generic.settingGroups.scoreboardObjectives.title',
				group: 'scoreboardObjectives',
			},
			idScoreboardObjective: {
				title: tl(
					'animatedJava.exporters.generic.settings.idScoreboardObjective.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.idScoreboardObjective.description'
				),
				type: 'text',
				default: 'aj.id',
				onUpdate: validateFormattedStringSetting([]),
				group: 'scoreboardObjectives',
			},
			frameScoreboardObjective: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.frameScoreboardObjective.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.frameScoreboardObjective.description'
				),
				type: 'text',
				default: 'aj.%projectName.%animationName.frame',
				onUpdate: validateFormattedStringSetting(['%projectName', '%animationName']),
				group: 'scoreboardObjectives',
			},
			animatingFlagScoreboardObjective: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.animatingFlagScoreboardObjective.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.animatingFlagScoreboardObjective.description'
				),
				type: 'text',
				default: 'aj.%projectName.animating',
				onUpdate: validateFormattedStringSetting(['%projectName']),
				group: 'scoreboardObjectives',
			},
			animationLoopModeScoreboardObjective: {
				title: tl(
					'animatedJava.exporters.vanillaAnimation.settings.animationLoopModeScoreboardObjective.title'
				),
				description: tl(
					'animatedJava.exporters.vanillaAnimation.settings.animationLoopModeScoreboardObjective.description'
				),
				type: 'text',
				default: 'aj.%projectName.%animationName.loopMode',
				onUpdate: validateFormattedStringSetting([
					'%projectName',
					'%animationName',
				]),
				group: 'scoreboardObjectives',
			},
			exportMode: {
				title: tl(
					'animatedJava.exporters.generic.settings.exportMode.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.exportMode.description'
				),
				type: 'select',
				default: 'mcb',
				options: {
					vanilla:
						'animatedJava.exporters.generic.settings.exportMode.options.vanilla',
					mcb: 'animatedJava.exporters.generic.settings.exportMode.options.mcb',
				},
			},
			mcbFilePath: {
				title: tl(
					'animatedJava.exporters.generic.settings.mcbFilePath.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.mcbFilePath.description'
				),
				type: 'filepath',
				default: '',
				props: {
					dialogOpts: {
						get defaultPath() {
							return `${AJ.settings.animatedJava.projectName}.mc`
						},
						promptToCreate: true,
						properties: ['openFile'],
					},
				},
				onUpdate(d: aj.SettingDescriptor) {
					if (d.value != '') {
						const p = new Path(d.value)
						const b = p.parse()
						if (
							b.base !==
							`${AJ.settings.animatedJava.projectName}.mc`
						) {
							d.isValid = false
							d.error = format(
								tl(
									'animatedJava.exporters.generic.settings.mcbFilePath.errors.mustBeNamedAfterProject'
								),
								{
									projectName:
										AJ.settings.animatedJava.projectName,
								}
							)
						}
					} else {
						d.isValid = false
						d.error = genericEmptySettingText
					}
					return d
				},
				isVisible(settings: any) {
					return (
						settings.vanillaAnimationExporter.exportMode === 'mcb'
					)
				},
				dependencies: [
					'vanillaAnimationExporter.exportMode',
					'animatedJava.projectName',
				],
			},
			mcbConfigPath: {
				title: tl(
					'animatedJava.exporters.generic.settings.mcbConfigPath.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.mcbConfigPath.description'
				),
				type: 'filepath',
				default: '',
				optional: true,
				props: {
					dialogOpts: {
						get defaultPath() {
							return 'config.json'
						},
						promptToCreate: true,
						properties: ['openFile'],
					},
				},
				populate() {
					return ''
				},
				isValid(value: string) {
					return value == '' || value.endsWith('config.json')
				},
				isVisible(settings: any) {
					return (
						settings.vanillaAnimationExporter.exportMode === 'mcb'
					)
				},
				dependencies: ['vanillaAnimationExporter.exportMode'],
			},
			dataPackPath: {
				title: tl(
					'animatedJava.exporters.generic.settings.dataPackPath.title'
				),
				description: tl(
					'animatedJava.exporters.generic.settings.dataPackPath.description'
				),
				type: 'filepath',
				default: '',
				props: {
					target: 'folder',
					dialogOpts: {
						get defaultPath() {
							return AJ.settings.animatedJava.projectName
						},
						promptToCreate: true,
						properties: ['openDirectory'],
					},
				},
				onUpdate(d: aj.SettingDescriptor) {
					if (d.value === '') {
						d.isValid = false
						d.error = genericEmptySettingText
					}
					return d
				},
				isVisible(settings: any) {
					return (
						settings.vanillaAnimationExporter.exportMode ===
						'vanilla'
					)
				},
				dependencies: ['vanillaAnimationExporter.exportMode'],
			},
		}
	)
	AJ.registerExportFunc('vanillaAnimationExporter', function () {
		AJ.build(
			(data: any) => {
				console.log('Input Data:', data)
				animationExport(data)
			},
			{
				generate_static_animation: true,
			}
		)
	})
}
if (Reflect.has(window, 'ANIMATED_JAVA')) {
	Exporter(window['ANIMATED_JAVA'])
} else {
	// @ts-ignore
	Blockbench.on('animated-java-ready', Exporter)
}
