import type * as aj from '../animatedJava'

import * as fs from 'fs'
import { tl } from '../util/intl'
import { Path } from '../util/path'
import { store } from '../util/store'
import { roundToN } from '../util/misc'
import { compileMC } from '../compileLangMC'
import { CustomError } from '../util/customError'
import { JsonText } from '../util/minecraft/jsonText'
import { Entities } from '../util/minecraft/entities'
import { SNBT, SNBTTag, SNBTTagType } from '../util/SNBT'
import { safeFunctionName, format, fixIndent } from '../util/replace'

interface vanillaStatueExporterSettings {
	modelTag: string
	rootTag: string
	allBonesTag: string
	individualBoneTag: string
	rootEntityType: string
	boneType: 'aecStack' | 'armorStand'
	internalScoreboardObjective: string
	idScoreboardObjective: string
	exportMode: 'vanilla' | 'mcb'
	mcbFilePath: string | undefined
	dataPackPath: string | undefined
	markerArmorStands: boolean
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

interface GeneratedDataPackFile {
	path: string
	contents: string
}

async function createMCFile(
	bones: aj.BoneObject,
	models: aj.ModelObject,
	animations: aj.Animations,
	settings: aj.GlobalSettings,
	variantModels: aj.VariantModels,
	variantTextureOverrides: aj.VariantTextureOverrides,
	variantTouchedModels: aj.variantTouchedModels
): Promise<{ mcFile: string; mcbConfig: MCBConfig }> {
	const FILE: string[] = []
	const ajSettings = settings.animatedJava
	const exporterSettings: vanillaStatueExporterSettings =
		settings.vanillaStatueExporter
	const projectName = safeFunctionName(ajSettings.projectName)

	let headYOffset = -1.4365

	const staticAnimationUuid = store.get('staticAnimationUuid')
	const staticFrame = animations[staticAnimationUuid].frames[0].bones
	const staticDistance = animations[staticAnimationUuid].maxDistance

	const rootExeErrorJsonText = new JsonText([
		'',
		{ text: 'AJ', color: 'green' },
		{ text: ' ? ', color: 'light_purple' },
		{ text: 'Error ?', color: 'red' },
		'\n',
		{ text: '%functionName', color: 'blue' },
		' ',
		{ text: 'must be executed as ', color: 'gray' },
		{ text: `aj.${projectName}.root`, color: 'light_purple' },
	]).toString()

	const scoreboards = {
		id: exporterSettings.idScoreboardObjective,
		internal: exporterSettings.internalScoreboardObjective,
	}

	const tags = {
		model: format(exporterSettings.modelTag, {
			projectName: projectName,
		}),
		root: format(exporterSettings.rootTag, {
			projectName: projectName,
		}),
		allBones: format(exporterSettings.allBonesTag, {
			projectName: projectName,
		}),
		individualBone: format(exporterSettings.individualBoneTag, {
			projectName: projectName,
		}),
	}

	interface entityTypes {
		bone: string
		root: string
		boneRoot: string
		boneDisplay?: string
	}
	const entityTypes: entityTypes = {
		bone: `#${projectName}:bone_entities`,
		root: exporterSettings.rootEntityType,
		boneRoot: 'minecraft:armor_stand',
		boneDisplay: 'minecraft:armor_stand',
	}
	// switch (statueExporterSettings.boneType) {
	// 	case 'aecStack':
	// 		entity_types.bone_root = 'minecraft:area_effect_cloud'
	// 		entity_types.bone_display = 'minecraft:armor_stand'
	// 		break
	// 	default:
	// 		entity_types.bone_root = 'minecraft:armor_stand'
	// 		// entity_types.bone_display = undefined
	// 		break
	// }

	//? Install Function
	FILE.push(`
	function install {
		${Object.entries(scoreboards)
			.map(([k, v]) => `scoreboard objectives add ${v} dummy`)
			.join('\n')}
	}
	function uninstall {
		${Object.entries(scoreboards)
			.map(([k, v]) => `scoreboard objectives remove ${v}`)
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

	//? Remove dir
	FILE.push(`
	dir remove {
		function all {
			kill @e[type=${entityTypes.root},tag=${tags.model}]
			kill @e[type=${entityTypes.bone},tag=${tags.model}]
		}
		function this {
			execute (if entity @s[tag=${tags.root}] at @s) {
				scoreboard players operation # ${scoreboards.id} = @s ${scoreboards.id}
				execute as @e[type=${entityTypes.bone},tag=${
		tags.model
	},distance=..${staticDistance}] if score @s ${scoreboards.id} = # ${
		scoreboards.id
	} run kill @s
				kill @s
			} else {
				tellraw @s ${rootExeErrorJsonText.replace(
					'%functionName',
					`${projectName}:remove/all`
				)}
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

			updateModelFromVariant(variant: {
				[index: string]: aj.VariantModel
			}) {
				if (variant[this.boneName]) {
					this.customModelData =
						variant[this.boneName].aj.customModelData
				} else {
					this.resetCustomModelData()
				}
			}
			resetCustomModelData() {
				this.customModelData = this.model.aj.customModelData
			}

			get nbt(): SNBTTag {
				const nbt = SNBT.parse(bones[this.boneName].nbt || '{}')
				nbt._merge(
					SNBT.Compound({
						Invisible: SNBT.Boolean(true),
						Marker: SNBT.Boolean(
							exporterSettings.markerArmorStands
						),
						NoGravity: SNBT.Boolean(true),
						DisabledSlots: SNBT.Int(4144959),
					})
				)
				nbt.assert('Tags', SNBTTagType.LIST)
				nbt.get('Tags').push(
					SNBT.String('new'),
					SNBT.String(tags.model),
					SNBT.String(tags.allBones),
					SNBT.String(
						format(tags.individualBone, {
							boneName: this.boneName,
						})
					)
				)
				nbt.assert('ArmorItems', SNBTTagType.LIST)
				const armorItems = nbt.get('ArmorItems')
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
				nbt.assert('Pose', SNBTTagType.COMPOUND)
				const rot = this.rot
				nbt.set(
					'Pose.Head',
					SNBT.List([
						SNBT.Float(rot.x),
						SNBT.Float(rot.y),
						SNBT.Float(rot.z),
					])
				)

				return nbt
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
				summon.updateModelFromVariant(variant)
			}
			// prettier-ignore
			FILE.push(`
				function ${variantName} {
					summon ${entityTypes.root} ~ ~ ~ ${rootEntityNbt}
					execute as @e[type=${entityTypes.root},tag=${tags.root},tag=new,distance=..1,limit=1] at @s rotated ~ 0 run {
						execute store result score @s ${scoreboards.id} run scoreboard players add .aj.last_id ${scoreboards.internal} 1
						${summons.map(v => v.toString()).join('\n')}
						execute as @e[type=${entityTypes.bone},tag=${tags.model},tag=new,distance=..${staticDistance}] positioned as @s run {
							scoreboard players operation @s ${scoreboards.id} = .aj.last_id ${scoreboards.internal}
							tp @s ~ ~ ~ ~ ~
							tag @s remove new
						}
						tag @s remove new
					}
				}
			`)
		}
		FILE.push(`}`)
	}

	if (Object.keys(variantTouchedModels).length > 0) {
		const variantBoneModifier = `data modify entity @s[tag=${tags.individualBone}] ArmorItems[-1].tag.CustomModelData set value %customModelData`
		FILE.push(`dir set_variant {`)
		for (const [variantName, variant] of Object.entries(
			variantModels as Record<string, any>
		)) {
			const thisVariantTouchedModels = {
				...variantTouchedModels,
				...variant,
			}
			const thisVariantCommands = Object.entries(
				thisVariantTouchedModels as Record<string, any>
			).map(([k, v]) =>
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
						execute as @e[type=${entityTypes.boneDisplay},tag=${tags.allBones},distance=..${staticDistance}] if score @s aj.id = .this aj.id run {
							${thisVariantCommands.join('\n')}
						}
					} else {
						tellraw @s ${rootExeErrorJsonText.replace('%functionName',`${projectName}:set_variant/${variantName}`)}
					}
				}
			`)
		}
		FILE.push('}')
	}

	const mcbConfig: MCBConfig = {
		dev: false,
		header: '#Code generated by Animated Java (https://animated-java.dev/)',
		internalScoreboard: scoreboards.internal,
		generatedDirectory: 'zzz',
	}

	return { mcFile: fixIndent(FILE), mcbConfig }
}

async function exportMCFile(
	generated: { mcFile: string; mcbConfig: MCBConfig },
	ajSettings: aj.GlobalSettings,
	exporterSettings: vanillaStatueExporterSettings
) {
	if (!exporterSettings.mcbFilePath) {
		throw new CustomError('MCB File Path Undefined', {
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
	exporterSettings: vanillaStatueExporterSettings
) {
	if (!exporterSettings.dataPackPath) {
		console.log(exporterSettings.dataPackPath)
		throw new CustomError('Data Pack Folder Undefined', {
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
		})
	}
	console.log('mcFile:', generated.mcFile)
	console.log('mcbConfig:', generated.mcbConfig)
	if (exporterSettings) {
		Blockbench.writeFile(exporterSettings.mcbConfigPath, {
			content: JSON.stringify(generated.mcbConfig),
			custom_writer: null,
		})
	}

	const translatedCompilationText = tl(
		'animatedJava.exporters.generic.progress.exportingDataPack'
	)

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
				format(translatedCompilationText, {
					progress: (message.percent * 100).toPrecision(4),
				})
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
	console.log('Vanilla Data Pack:', dataPack)

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
	const translatedWritingText = tl(
		'animatedJava.exporters.generic.progress.writingDataPack'
	)
	const createdPaths = new Set()

	let timeOut = false

	function setProgress(cur: number, max: number, fileName: string) {
		if (!timeOut) {
			Blockbench.setProgress(cur / max, 50)
			Blockbench.setStatusBarText(
				format(translatedWritingText, {
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

async function statueExport(data: any) {
	const exporterSettings: vanillaStatueExporterSettings =
		data.settings.vanillaStatueExporter
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
			}
		}
		return d
	}
}

const Exporter = (AJ: any) => {
	AJ.settings.registerPluginSettings(
		'animatedJava.exporters.vanillaStatue', // Exporter ID
		'vanillaStatueExporter', // Exporter Settings Key
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
								'animatedJava.exporters.generic.settings.rootEntityType.errors.invalidNbt'
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
					return settings.vanillaStatueExporter.exportMode === 'mcb'
				},
				dependencies: [
					'vanillaStatueExporter.exportMode',
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
					return settings.vanillaStatueExporter.exportMode === 'mcb'
				},
				dependencies: ['vanillaStatueExporter.exportMode'],
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
						settings.vanillaStatueExporter.exportMode === 'vanilla'
					)
				},
				dependencies: ['vanillaStatueExporter.exportMode'],
			},
		}
	)
	AJ.registerExportFunc('vanillaStatueExporter', function () {
		AJ.build(
			(data: any) => {
				console.log('Input Data:', data)
				statueExport(data)
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
