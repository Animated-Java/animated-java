import * as aj from '../animatedJava'

import { CustomError } from '../util/customError'
import { JsonText } from '../util/minecraft/jsonText'
import { Path } from '../util/path'
import { removeKeyGently } from '../util/misc'
import { roundToN } from '../util/misc'
import { safeFunctionName, format, fixIndent } from '../util/replace'
import { SNBT, SNBTTag, SNBTTagType } from '../util/SNBT'
import { store } from '../util/store'
import { tl } from '../util/intl'
import { generateTree } from '../util/treeGen'
import { compileMC } from '../compileLangMC'
import * as fs from 'fs'

interface animationExporterSettings {
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
	frame: string
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
	settings: aj.Settings,
	variantModels: aj.VariantModels,
	variantTextureOverrides: aj.VariantTextureOverrides,
	variantTouchedModels: aj.variantTouchedModels
): Promise<{ mcFile: string; mcbConfig: MCBConfig }> {
	const ajSettings = settings.animatedJava
	const exporterSettings: animationExporterSettings =
		settings.animatedJava_exporter_animationExporter
	const projectName = safeFunctionName(ajSettings.projectName)

	let headYOffset = -1.813
	if (!exporterSettings.markerArmorStands) headYOffset += -0.1
	console.log(headYOffset)

	const staticAnimationUuid = store.get('static_animation_uuid')
	const staticFrame = animations[staticAnimationUuid].frames[0].bones
	const staticDistance = roundToN(
		animations[staticAnimationUuid].maxDistance + -headYOffset,
		1000
	)
	const maxDistance = roundToN(
		Object.values(animations).reduce((o, n) => {
			return Math.max(o, n.maxDistance)
		}, -Infinity) + -headYOffset,
		1000
	)
	animations = removeKeyGently(staticAnimationUuid, animations)
	console.log(animations)

	const FILE: string[] = []

	const rootExeErrorJsonText = new JsonText([
		'',
		{ text: 'AJ', color: 'green' },
		{ text: ' → ', color: 'light_purple' },
		{ text: 'Error ☠', color: 'red' },
		'\n',
		{ text: '%functionName', color: 'blue' },
		' ',
		{ text: 'must be executed as ', color: 'gray' },
		{ text: `aj.${projectName}.root`, color: 'light_purple' },
	]).toString()

	const scoreboards = Object.fromEntries(
		Object.entries({
			id: exporterSettings.idScoreboardObjective,
			internal: exporterSettings.internalScoreboardObjective,
			frame: exporterSettings.frameScoreboardObjective,
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

	// prettier-ignore
	FILE.push(`
		function load {
			scoreboard players add .aj.animation ${scoreboards.animatingFlag} 0
			scoreboard players add .aj.anim_loop ${scoreboards.animatingFlag} 0
		}
	`)
	FILE.push(`
		function reset_animation_flags {
			scoreboard players set .aj.animation ${scoreboards.animatingFlag} 0
			scoreboard players set .aj.anim_loop ${scoreboards.animatingFlag} 0
		}
	`)
	// prettier-ignore
	FILE.push(`
		function install {
			scoreboard objectives add ${scoreboards.internal} dummy
			scoreboard objectives add ${scoreboards.id} dummy
			scoreboard objectives add ${scoreboards.frame} dummy
			scoreboard objectives add ${scoreboards.animatingFlag} dummy
			${Object.values(animations)
				.map((v) =>
					`scoreboard objectives add ${scoreboards.animationLoopMode} dummy`.replace(
						'%animationName',
						v.name
					)
				)
				.join('\n')}
			scoreboard players add .aj.animation ${scoreboards.animatingFlag} 0
			scoreboard players add .aj.anim_loop ${scoreboards.animatingFlag} 0
		}
	`)
	// prettier-ignore
	FILE.push(`
		function uninstall {
			scoreboard objectives remove ${scoreboards.internal}
			scoreboard objectives remove ${scoreboards.id}
			scoreboard objectives remove ${scoreboards.frame}
			scoreboard objectives remove ${scoreboards.animatingFlag}
			${Object.values(animations)
				.map((v) =>
					`scoreboard objectives remove ${scoreboards.animationLoopMode}`.replace(
						'%animationName',
						v.name
					)
				)
				.join('\n')}
		}
	`)

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
					execute as @e[type=${entityTypes.bone},tag=${tags.model},distance=..${staticDistance}] if score @s ${scoreboards.id} = # ${scoreboards.id} run kill @s
					kill @s
				} else {
					tellraw @s ${rootExeErrorJsonText.replace('%functionName', `${projectName}:remove/all`)}
				}
			}
		}
	`)

	{
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
				const passengerNbt = SNBT.parse(bones[this.boneName].nbt)
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
					x: roundToN(this.bone.rot.x, 1000),
					y: roundToN(this.bone.rot.y, 1000),
					z: roundToN(this.bone.rot.z, 1000),
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
							execute as @e[type=${entityTypes.bone},tag=${tags.model},tag=new,distance=..${staticDistance}] positioned as @s run {
								scoreboard players operation @s ${scoreboards.id} = .aj.last_id ${scoreboards.internal}
								tp @s ~ ~ ~ ~ ~
								tag @s remove new
							}
						}
						tag @s remove new
						# Set all animation modes to configured default
						${Object.values(animations).map(
							v => `scoreboard players set @s ${scoreboards.animationLoopMode.replace('%animationName',v.name)} ${loopModeIDs.indexOf(v.loopMode)}`
						).join('\n')}
					}
					# Assert animation flags
					scoreboard players set @s ${scoreboards.animatingFlag} 0
					scoreboard players add .aj.animation ${scoreboards.animatingFlag} 0
					scoreboard players add .aj.anim_loop ${scoreboards.animatingFlag} 0
				}
			`)
		}
		FILE.push(`}`)
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
				x: roundToN(bone.pos.x, 1000),
				y: roundToN(bone.pos.y + headYOffset, 1000),
				z: roundToN(bone.pos.z, 1000),
			})
			const displayModifier = format(boneDisplayModifier, {
				boneName,
				x: roundToN(bone.rot.x, 1000),
				y: roundToN(bone.rot.y, 1000),
				z: roundToN(bone.rot.z, 1000),
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
					# Remove all animation tags
					${Object.values(animations).map(v => `tag @s remove aj.${projectName}.anim.${v.name}`).join('\n')}
					# Reset animation time
					scoreboard players set @s ${scoreboards.frame} 0

					scoreboard players operation .this ${scoreboards.id} = @s ${scoreboards.id}
					execute as @e[type=${entityTypes.boneRoot},tag=${tags.allBones},distance=..${maxDistance}] if score @s ${scoreboards.id} = .this ${scoreboards.id} run {
						${baseModifiers.join('\n')}
						execute store result score .calc ${scoreboards.internal} run data get entity @s Air
						execute store result entity @s Air short 1 run scoreboard players add .calc ${scoreboards.internal} 1
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
		//? Animation Loop function
		const animationRunCommand = `execute if entity @s[tag=aj.${projectName}.anim.%animationName] at @s run function ${projectName}:animations/%animationName/next_frame`
		const animationRunCommands = Object.values(animations).map((v) =>
			format(animationRunCommand, { animationName: v.name })
		)
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
					${animationRunCommands.join('\n')}
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
		//? Animation Dir
		FILE.push(`dir animations {`)

		for (const animation of Object.values(animations)) {
			if (animation.frames.length <= 1) {
				throw new CustomError('Zero Length Animation Error', {
					intentional: true,
					dialog: {
						id: 'animatedJava_exporter_animationExporter.popup.warning.zeroLengthAnimation',
						title: tl(
							'animatedJava_exporter_animationExporter.popup.warning.zeroLengthAnimation.title'
						),
						lines: format(
							tl(
								'animatedJava_exporter_animationExporter.popup.warning.zeroLengthAnimation.body'
							),
							{
								animationName: animation.name,
							}
						)
							.split('\n')
							.map((line: string) => `<p>${line}</p>`),
					},
				})
			}

			const thisAnimationLoopMode = format(
				scoreboards.animationLoopMode,
				{
					animationName: animation.name,
				}
			)

			const touchedBones = Object.keys(animation.frames[0].bones)

			console.log('Animation:', animation)
			const animationTree = generateTree(animation.frames)
			console.log('Animation Tree:', animationTree)

			const animationScripts: string[] = []
			for (const frame of animation.frames) {
				if (frame.scripts?.script) {
					animationScripts.push(
						`execute if score .this ${
							scoreboards.frame
						} matches ${animation.frames.indexOf(frame)} run {\n${
							frame.scripts.script[0]
						}\n}`
					)
				}
			}
			console.log(animationScripts)

			function collectBoneTree(boneName: string, animationTreeItem: any) {
				if (animationTreeItem.type === 'layer') {
					return {
						type: 'branch',
						branches: animationTreeItem.items.map((v: any) =>
							collectBoneTree(boneName, v)
						),
						min: animationTreeItem.min,
						max: animationTreeItem.max,
					}
				} else {
					return {
						type: 'leaf',
						index: animationTreeItem.index,
						frame: animationTreeItem.item.bones[boneName],
					}
				}
			}

			const boneTrees = {}
			for (const [boneName, bone] of Object.entries(bones)) {
				if (!touchedBones.includes(boneName)) continue
				const tree = collectBoneTree(boneName, animationTree)
				console.log('Bone Tree:', tree)
				function generateBaseTree(tree: any): {
					base: string
					display: string
				} {
					if (tree.type === 'branch') {
						let retBase: string[] = []
						let retDisplay: string[] = []
						// prettier-ignore
						tree.branches.forEach((v: any)=> {
							if (v.type === 'branch') {
								const t = generateBaseTree(v)
								retBase.push(`execute if score .this ${scoreboards.frame} matches ${v.min}..${v.max-1} run {\n${t.base}\n}`)
								retDisplay.push(`execute if score .this ${scoreboards.frame} matches ${v.min}..${v.max-1} run {\n${t.display}\n}`)
							} else {
								let pos = v.frame.pos
								let rot = v.frame.rot
								// prettier-ignore
								retBase.push(`execute if score .this ${scoreboards.frame} matches ${v.index} run tp @s ^${pos.x} ^${pos.y + headYOffset} ^${pos.z} ~ ~`)
								retDisplay.push(`execute if score .this ${scoreboards.frame} matches ${v.index} run data modify entity @s Pose.Head set value [${rot.x}f,${rot.y}f,${rot.z}f]`)
							}
						})
						return {
							base: retBase.join('\n'),
							display: retDisplay.join('\n'),
						}
					}
				}
				boneTrees[boneName] = generateBaseTree(tree)
			}
			console.log('Collected Bone Trees:', boneTrees)
			// boneTrees is used in the next_frame function

			FILE.push(`dir ${animation.name} {`)
			// prettier-ignore
			FILE.push(`# Starts the animation from the first frame
				function play {
					# Make sure this function has been ran as the root entity
					execute(if entity @s[tag=${tags.root}] at @s) {
						# Add animation tag
						tag @s add aj.${projectName}.anim.${animation.name}
						# Reset animation time
						scoreboard players set @s ${scoreboards.frame} 0
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
						scoreboard players set @s ${scoreboards.frame} 0
						# load initial animation frame without running scripts
						scoreboard players set .noScripts ${scoreboards.internal} 1
						function ${projectName}:animations/${animation.name}/next_frame
						scoreboard players set .noScripts ${scoreboards.internal} 0
						# Reset animation time
						scoreboard players set @s ${scoreboards.frame} 0
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
					scoreboard players operation .this ${scoreboards.frame} = @s ${scoreboards.frame}
					execute rotated ~ 0 as @e[type=${entityTypes.bone},tag=${tags.allBones},distance=..${maxDistance}] if score @s ${scoreboards.id} = .this ${scoreboards.id} run {
						# Split by type
						execute if entity @s[type=${entityTypes.boneRoot}] run {
							${(Object.entries(boneTrees) as Record<string, any>).map(([boneName,tree]) => {
								return `execute if entity @s[tag=${tags.individualBone.replace('%boneName', boneName)}] run {\n${tree.base}\n}`
							}).join('\n\n')}
							execute store result entity @s Air short 1 run scoreboard players get .this ${scoreboards.frame}
						}
						# Split by type
						execute if entity @s[type=${entityTypes.boneDisplay}] run {
							${(Object.entries(boneTrees) as Record<string, any>).map(([boneName,tree]) => {
								return `execute if entity @s[tag=${tags.individualBone.replace('%boneName', boneName)}] run {\n${tree.display}\n}`
							}).join('\n\n')}
							tp @s ~ ~ ~ ~ ~
						}
					}

					${animationScripts.length > 0 ? `
						# Play scripts as root entity if scripts enabled
						execute if score .noScripts ${scoreboards.internal} matches 0 run {
							${animationScripts.join('\n')}
						}
					` : ''}

					# Increment frame
					scoreboard players add @s ${scoreboards.frame} 1
					# Let the anim_loop know we're still running
					scoreboard players set .aj.animation ${scoreboards.animatingFlag} 1
					# If (the next frame is the end of the animation) perform the necessary actions for the loop mode of the animation
					execute if score @s ${scoreboards.frame} matches ${animation.frames.length}.. run function ${projectName}:animations/${animation.name}/end
				}`
			)

			// prettier-ignore
			FILE.push(`# Performs a loop mode action depending on what the animation's configured loop mode is
				function end {
					# Play Once
					execute if score @s ${thisAnimationLoopMode} matches 0 run {
						function ${projectName}:animations/${animation.name}/stop
					}
					# Hold on last frame
					execute if score @s ${thisAnimationLoopMode} matches 1 run {
						function ${projectName}:animations/${animation.name}/pause
					}
					# loop
					execute if score @s ${thisAnimationLoopMode} matches 2 run {
						scoreboard players set @s ${scoreboards.frame} 0
					}
				}
			`)

			FILE.push(`}`)
		}

		FILE.push(`}`)
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
	ajSettings: aj.Settings,
	exporterSettings: animationExporterSettings
) {
	if (!exporterSettings.mcbFilePath) {
		throw new CustomError(
			'animatedJava_exporter_animationExporter.popup.error.mcbFilePathNotDefined.title',
			{
				intentional: true,
				dialog: {
					title: tl(
						'animatedJava_exporter_animationExporter.popup.error.mcbFilePathNotDefined.title'
					),
					id: '',
					lines: tl(
						'animatedJava_exporter_animationExporter.popup.error.mcbFilePathNotDefined.body'
					)
						.split('\n')
						.map((line: string) => `<p>${line}</p>`),
				},
			}
		)
	}

	Blockbench.writeFile(exporterSettings.mcbFilePath, {
		content: generated.mcFile,
		custom_writer: null,
	})
}

async function exportDataPack(
	generated: { mcFile: string; mcbConfig: MCBConfig },
	ajSettings: aj.Settings,
	exporterSettings: animationExporterSettings
) {
	if (!exporterSettings.dataPackPath) {
		console.log(exporterSettings.dataPackPath)
		throw new CustomError(
			'animatedJava_exporter_animationExporter.popup.error.dataPackFilePathNotDefined.title',
			{
				intentional: true,
				dialog: {
					title: tl(
						'animatedJava_exporter_animationExporter.popup.error.dataPackFilePathNotDefined.title'
					),
					id: '',
					lines: tl(
						'animatedJava_exporter_animationExporter.popup.error.dataPackFilePathNotDefined.body'
					)
						.split('\n')
						.map((line: string) => `<p>${line}</p>`),
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
						'animatedJava_exporter_animationExporter.exportingDataPackProgress'
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
	const tldMessage = tl(
		'animatedJava_exporter_animationExporter.writingDataPackProgress'
	)
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
	const exporterSettings: animationExporterSettings =
		data.settings.animatedJava_exporter_animationExporter
	const generated = await createMCFile(
		data.bones,
		data.models,
		data.animations,
		data.settings,
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

	Blockbench.showQuickMessage(
		tl('animatedJava_exporter_animationExporter.successfullyExported')
	)
}

const Exporter = (AJ: any) => {
	AJ.settings.registerPluginSettings(
		'animatedJava_exporter_animationExporter',
		{
			rootEntityType: {
				type: 'text',
				default: 'minecraft:marker',
				populate() {
					return 'minecraft:marker'
				},
				isValid(value: any) {
					return value != ''
				},
			},
			rootEntityNbt: {
				type: 'text',
				default: '{}',
				populate() {
					return '{}'
				},
				isValid(value: any) {
					return value != ''
				},
			},
			markerArmorStands: {
				type: 'checkbox',
				default: true,
				populate() {
					return true
				},
				isValid(value: any) {
					return typeof value === 'boolean'
				},
			},
			modelTag: {
				type: 'text',
				default: 'aj.%projectName',
				populate() {
					return 'aj.%projectName'
				},
				isValid(value: any) {
					return value != ''
				},
				isResetable: true,
			},
			rootTag: {
				type: 'text',
				default: 'aj.%projectName.root',
				populate() {
					return 'aj.%projectName.root'
				},
				isValid(value: any) {
					return value != ''
				},
				isResetable: true,
			},
			allBonesTag: {
				type: 'text',
				default: 'aj.%projectName.bone',
				populate() {
					return 'aj.%projectName.bone'
				},
				isValid(value: any) {
					return value != ''
				},
				isResetable: true,
			},
			boneModelDisplayTag: {
				type: 'text',
				default: 'aj.%projectName.bone_display',
				populate() {
					return 'aj.%projectName.bone_display'
				},
				isValid(value: any) {
					return value != ''
				},
				isResetable: true,
			},
			individualBoneTag: {
				type: 'text',
				default: 'aj.%projectName.bone.%boneName',
				populate() {
					return 'aj.%projectName.bone.%boneName'
				},
				isValid(value: any) {
					return value != ''
				},
				isResetable: true,
			},
			internalScoreboardObjective: {
				type: 'text',
				default: 'aj.i',
				populate() {
					return 'aj.i'
				},
				isValid(value: any) {
					return value != ''
				},
			},
			idScoreboardObjective: {
				type: 'text',
				default: 'aj.id',
				populate() {
					return 'aj.id'
				},
				isValid(value: any) {
					return value != ''
				},
			},
			frameScoreboardObjective: {
				type: 'text',
				default: 'aj.frame',
				populate() {
					return 'aj.frame'
				},
				isValid(value: any) {
					return value != ''
				},
			},
			animatingFlagScoreboardObjective: {
				type: 'text',
				default: 'aj.%projectName.animating',
				populate() {
					return 'aj.%projectName.animating'
				},
				isValid(value: any) {
					return value != ''
				},
			},
			animationLoopModeScoreboardObjective: {
				type: 'text',
				default: 'aj.%projectName.%animationName.loopMode',
				populate() {
					return 'aj.%projectName.%animationName.loopMode'
				},
				isValid(value: string) {
					return value != ''
				},
			},
			exportMode: {
				type: 'select',
				default: 'mcb',
				options: {
					vanilla:
						'animatedJava_exporter_animationExporter.setting.exportMode.vanilla.name',
					mcb: 'animatedJava_exporter_animationExporter.setting.exportMode.mcb.name',
				},
				populate() {
					return 'mcb'
				},
				isValid(value: string) {
					return value != ''
				},
			},
			mcbFilePath: {
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
				populate() {
					return ''
				},
				isValid(value: string) {
					const p = new Path(value)
					const b = p.parse()
					return (
						b.base === `${AJ.settings.animatedJava.projectName}.mc`
					)
				},
				isVisible(settings: any) {
					return (
						settings.animatedJava_exporter_animationExporter
							.exportMode === 'mcb'
					)
				},
				dependencies: [
					'animatedJava_exporter_animationExporter.exportMode',
				],
			},
			mcbConfigPath: {
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
						settings.animatedJava_exporter_animationExporter
							.exportMode === 'mcb'
					)
				},
				dependencies: [
					'animatedJava_exporter_animationExporter.exportMode',
				],
			},
			dataPackPath: {
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
				populate() {
					return ''
				},
				isValid(value: string) {
					return value != ''
				},
				isVisible(settings: any) {
					return (
						settings.animatedJava_exporter_animationExporter
							.exportMode === 'vanilla'
					)
				},
				dependencies: [
					'animatedJava_exporter_animationExporter.exportMode',
				],
			},
		}
	)
	AJ.registerExportFunc('animationExporter', function () {
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
