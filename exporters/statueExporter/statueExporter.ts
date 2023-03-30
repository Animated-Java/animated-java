// @ts-ignore
import en from './lang/en.yaml'

function getExportVersionId() {
	return Math.round(Math.random() * 2 ** 31 - 1 - (Math.random() * 2 ** 31 - 1))
}

export function loadExporter() {
	const API = AnimatedJava.API
	const { NbtTag, NbtCompound, NbtString, NbtList, NbtInt, NbtFloat } = AnimatedJava.API.deepslate

	API.addTranslations('en', en as Record<string, string>)

	const TRANSLATIONS = {
		datapack_folder: {
			name: API.translate('animated_java.statue_exporter.settings.datapack_folder'),
			description: API.translate(
				'animated_java.statue_exporter.settings.datapack_folder.description'
			).split('\n'),
			error: {
				unset: API.translate(
					'animated_java.statue_exporter.settings.datapack_folder.error.unset'
				),
			},
		},
		outdated_rig_warning: {
			name: API.translate('animated_java.statue_exporter.settings.outdated_rig_warning'),
			description: API.translate(
				'animated_java.statue_exporter.settings.outdated_rig_warning.description'
			).split('\n'),
		},
		include_convenience_functions: {
			name: API.translate(
				'animated_java.statue_exporter.settings.include_convenience_functions'
			),
			description: API.translate(
				'animated_java.statue_exporter.settings.include_convenience_functions.description'
			).split('\n'),
		},
		root_entity_nbt: {
			name: API.translate('animated_java.statue_exporter.settings.root_entity_nbt'),
			description: API.translate(
				'animated_java.statue_exporter.settings.root_entity_nbt.description'
			).split('\n'),
		},
	}

	async function fileExists(path: string) {
		return !!(await fs.promises.stat(path).catch(() => false))
	}

	function arrayToNbtFloatArray(array: number[]) {
		return new NbtList(array.map(v => new NbtFloat(v)))
	}

	function matrixToNbtFloatArray(matrix: THREE.Matrix4) {
		const matrixArray = new THREE.Matrix4().copy(matrix).transpose().toArray()
		return arrayToNbtFloatArray(matrixArray)
	}

	function transformationToNbt(pos: THREE.Vector3, rot: THREE.Quaternion, scale: THREE.Vector3) {
		return new NbtCompound(
			new Map()
				.set('translation', arrayToNbtFloatArray(pos.toArray()))
				.set('right_rotation', arrayToNbtFloatArray([0, 0, 0, 1]))
				.set('left_rotation', arrayToNbtFloatArray(rot.toArray()))
				.set('scale', arrayToNbtFloatArray(scale.toArray()))
		)
	}

	new API.Exporter({
		id: 'animated_java:statue_exporter',
		name: API.translate('animated_java.statue_exporter.name'),
		description: API.translate('animated_java.statue_exporter.description'),
		getSettings() {
			return {
				datapack_folder: new API.Settings.FolderSetting(
					{
						id: 'animated_java:statue_exporter/datapack_folder',
						displayName: TRANSLATIONS.datapack_folder.name,
						description: TRANSLATIONS.datapack_folder.description,
						defaultValue: '',
					},
					function onUpdate(setting) {
						if (!setting.value) {
							setting.infoPopup = API.createInfo(
								'error',
								TRANSLATIONS.datapack_folder.error.unset
							)
						}
					}
				),
				outdated_rig_warning: new API.Settings.CheckboxSetting({
					id: 'animated_java:statue_exporter/outdated_rig_warning',
					displayName: TRANSLATIONS.outdated_rig_warning.name,
					description: TRANSLATIONS.outdated_rig_warning.description,
					defaultValue: true,
				}),
				include_convenience_functions: new API.Settings.CheckboxSetting({
					id: 'animated_java:statue_exporter/include_convenience_functions',
					displayName: TRANSLATIONS.include_convenience_functions.name,
					description: TRANSLATIONS.include_convenience_functions.description,
					defaultValue: true,
				}),
				root_entity_nbt: new API.Settings.CodeboxSetting(
					{
						id: 'animated_java:statue_exporter/root_entity_nbt',
						displayName: TRANSLATIONS.root_entity_nbt.name,
						description: TRANSLATIONS.root_entity_nbt.description,
						language: 'nbt',
						defaultValue: '{}',
					},
					function onUpdate(setting) {
						try {
							NbtTag.fromString(setting.value)
						} catch (e) {
							setting.infoPopup = API.createInfo('error', e.message)
						}
					}
				),
			}
		},
		settingsStructure: [
			{
				type: 'setting',
				settingId: 'animated_java:statue_exporter/datapack_folder',
			},
			{
				type: 'setting',
				settingId: 'animated_java:statue_exporter/outdated_rig_warning',
			},
			{
				type: 'setting',
				settingId: 'animated_java:statue_exporter/include_convenience_functions',
			},
			{
				type: 'setting',
				settingId: 'animated_java:statue_exporter/root_entity_nbt',
			},
		],
		async export(ajSettings, projectSettings, exporterSettings, renderedAnimations, rig) {
			if (!Project?.animated_java_variants) throw new Error('No variants found')
			console.log('Animated Java Settings', ajSettings)
			console.log('Project Settings', projectSettings)
			console.log('Exporter Settings', exporterSettings)
			console.log('Rendered Animations', renderedAnimations)
			console.log('Rig', rig)

			console.log('Beginning export process...')

			//--------------------------------------------
			// ANCHOR Settings
			//--------------------------------------------
			const NAMESPACE = projectSettings.project_namespace.value
			const RIG_ITEM = projectSettings.rig_item.value
			const EXPORT_FOLDER = exporterSettings.datapack_folder.value
			const variants = Project.animated_java_variants.variants
			const outdatedRigWarningEnabled = exporterSettings.outdated_rig_warning.value
			const userRootEntityNbt = NbtTag.fromString(exporterSettings.root_entity_nbt.value)

			//--------------------------------------------
			// ANCHOR Data Pack
			//--------------------------------------------

			const scoreboard = {
				i: 'aj.i',
				id: 'aj.id',
				exportVersion: `aj.export_version`,
				rigLoaded: `aj.${NAMESPACE}.rig_loaded`,
			}
			const tags = {
				new: 'aj.new',
				rootEntity: `aj.${NAMESPACE}.root`,
				boneEntity: `aj.${NAMESPACE}.bone.%s`,
				locatorTag: `aj.${NAMESPACE}.locator.%s`,
			}
			const entity_types = {
				ajRoot: `#${NAMESPACE}:aj_root`,
				ajBone: `#${NAMESPACE}:aj_bone`,
			}

			const datapack = new API.VirtualFileSystem.VirtualFolder(NAMESPACE)
			const dataFolder = datapack.newFolder('data')

			datapack
				.chainNewFile('animated_java.mcmeta', {
					project_namespace: NAMESPACE,
				})
				.chainNewFile('pack.mcmeta', {
					pack: {
						pack_format: 12, // 12 since 1.19.4
						description: `"${NAMESPACE}" A Data Pack generated by Animated Java using the Statue Exporter.`,
					},
				})

			const [namespaceFolder, animatedJavaFolder] = dataFolder.newFolders(
				NAMESPACE,
				`zzz_${NAMESPACE}_internal`
			)
			namespaceFolder.newFolders('functions', 'tags')
			animatedJavaFolder.newFolders('functions', 'tags', 'item_modifiers')
			const AJ_NAMESPACE = animatedJavaFolder.name

			//--------------------------------------------
			// ANCHOR minecraft function tags
			//--------------------------------------------

			const functionTagFolder = dataFolder.newFolder('minecraft/tags/functions')
			functionTagFolder.newFile('load.json', {
				replace: false,
				values: [`${AJ_NAMESPACE}:load`],
			})
			functionTagFolder.newFile('tick.json', {
				replace: false,
				values: [`${AJ_NAMESPACE}:tick`],
			})

			//--------------------------------------------
			// ANCHOR entity_type tags
			//--------------------------------------------

			namespaceFolder
				.newFolder('tags/entity_types')
				.chainNewFile('aj_root.json', {
					replace: false,
					values: ['minecraft:item_display'],
				})
				.chainNewFile('aj_bone.json', {
					replace: false,
					values: ['minecraft:item_display'],
				})

			//--------------------------------------------
			// ANCHOR function tags
			//--------------------------------------------

			namespaceFolder
				.newFolder('tags/functions')
				.chainNewFile('on_summon.json', {
					replace: false,
					values: [],
				})
				.chainNewFile('on_tick.json', {
					replace: false,
					values: [],
				})
				.chainNewFile('on_load.json', {
					replace: false,
					values: [`${AJ_NAMESPACE}:on_load`],
				})
				.chainNewFile('on_remove.json', {
					replace: false,
					values: [],
				})

			//--------------------------------------------
			// tellraw messages
			//--------------------------------------------

			const errorMustBeRunAsRoot = new API.JsonText([
				'',
				{ text: '[' },
				{ text: 'Animated Java', color: 'aqua' },
				{ text: '] ' },
				{ text: 'ERROR ☠', color: 'red' },
				{ text: ' > ', color: 'gray' },
				[
					{ text: 'The function', color: 'yellow' },
					{ text: ' %s ', color: 'blue' },
					{ text: 'must be run' },
					{ text: ' as ', color: 'red' },
					{ text: 'the root entity!' },
				],
			])

			const errorOutOfDateRig = new API.JsonText([
				'',
				{ text: '[' },
				{ text: 'Animated Java', color: 'aqua' },
				{ text: '] ' },
				[
					{ text: 'ERROR ☠', color: 'red' },
					{ text: ' > ', color: 'gray' },
					{ text: 'An existing rig is out-of-date!' },
					{
						text: ' Please re-summon the highlighted rig to update it to the newly exported version.',
						color: 'yellow',
					},
				],
			])

			//--------------------------------------------
			// ANCHOR load/tick functions
			//--------------------------------------------

			animatedJavaFolder
				.accessFolder('functions')
				.chainNewFile('load.mcfunction', [
					// Scoreboard objectives
					...Object.values(scoreboard)
						.filter(s => !s.includes('%s'))
						.map(s => `scoreboard objectives add ${s} dummy`),
					// prettier-ignore
					...variants.map((v, i) => `scoreboard players set $aj.${NAMESPACE}.variant.${v.name} ${scoreboard.id} ${i}`),
					// Variable initialization
					`scoreboard players add .aj.last_id ${scoreboard.id} 0`,
					// version ID
					`scoreboard players set .aj.export_version ${
						scoreboard.i
					} ${getExportVersionId()}`,
					// load function tag
					`scoreboard players reset * ${scoreboard.rigLoaded}`,
					`execute as @e[type=${entity_types.ajRoot},tag=${tags.rootEntity}] run function #${NAMESPACE}:on_load`,
				])
				.chainNewFile('on_load.mcfunction', [
					`scoreboard players set @s ${scoreboard.rigLoaded} 1`,
					outdatedRigWarningEnabled
						? `execute unless score @s ${scoreboard.exportVersion} = .aj.export_version ${scoreboard.i} at @s run function ${AJ_NAMESPACE}:upgrade_rig`
						: undefined,
					`function #${NAMESPACE}:on_load`,
				])
				.chainNewFile('tick.mcfunction', [
					`execute as @e[type=${entity_types.ajRoot},tag=${tags.rootEntity}] run function ${AJ_NAMESPACE}:tick_as_root`,
				])
				.chainNewFile('tick_as_root.mcfunction', [
					`execute unless score @s ${scoreboard.rigLoaded} matches 1 run function ${AJ_NAMESPACE}:on_load`,
					`execute at @s on passengers run tp @s ~ ~ ~ ~180 ~`,
					`function #${NAMESPACE}:on_tick`,
				])

			//--------------------------------------------
			// ANCHOR uninstall function
			//--------------------------------------------

			namespaceFolder.accessFolder('functions').chainNewFile('uninstall.mcfunction', [
				// Scoreboard objectives
				...Object.values(scoreboard)
					.filter(s => !s.includes('%s'))
					.map(s => `scoreboard objectives remove ${s}`),
			])

			//--------------------------------------------
			// ANCHOR summon functions
			//--------------------------------------------

			const summonNbt = userRootEntityNbt.isCompound() ? userRootEntityNbt : new NbtCompound()
			const userSummonTags = summonNbt.get('Tags')
			const summonTags = userSummonTags instanceof NbtList ? userSummonTags : new NbtList()
			summonTags.add(new NbtString(tags.new))
			summonTags.add(new NbtString(tags.rootEntity))
			summonNbt.set('Tags', summonTags)

			const passengers = new NbtList()
			for (const [uuid, bone] of Object.entries(rig.nodeMap)) {
				const pose = rig.defaultPose.find(p => p.uuid === uuid)
				const passenger = new NbtCompound()
					.set('id', new NbtString('minecraft:item_display'))
					.set(
						'Tags',
						new NbtList([
							new NbtString(tags.new),
							new NbtString(API.formatStr(tags.boneEntity, [bone.name])),
						])
					)
					.set(
						'transformation',
						// transformationToNbt(pose.pos, pose.rot, pose.scale)
						matrixToNbtFloatArray(pose.matrix)
					)
				if (bone.type === 'bone') {
					passenger.set(
						'item',
						new NbtCompound()
							.set('id', new NbtString(RIG_ITEM))
							.set('Count', new NbtInt(1))
							.set(
								'tag',
								new NbtCompound().set(
									'CustomModelData',
									new NbtInt(bone.customModelData)
								)
							)
					)
					const userBoneNbt = NbtTag.fromString(bone.nbt)
					if (userBoneNbt instanceof NbtCompound)
						userBoneNbt.forEach((key, value) => {
							passenger.set(key, value)
						})
				}
				passengers.add(passenger)
			}
			summonNbt.set('Passengers', passengers)

			const variantSummonFolder = namespaceFolder
				.accessFolder('functions')
				.chainNewFile('summon.mcfunction', [
					`summon minecraft:item_display ~ ~ ~ ${summonNbt.toString()}`,
					`execute as @e[type=#${NAMESPACE}:aj_root,limit=1,distance=..1,tag=${tags.new}] run function ${AJ_NAMESPACE}:summon/as_root`,
				])
				.newFolder('summon')

			if (exporterSettings.include_convenience_functions.value === true) {
				for (const variant of variants) {
					if (variant.default) continue
					variantSummonFolder.newFile(`${variant.name}.mcfunction`, [
						`scoreboard players set #variant ${scoreboard.i} ${variants.indexOf(
							variant
						)}`,
						`function ${NAMESPACE}:summon`,
					])
				}
			}

			animatedJavaFolder
				.accessFolder('functions')
				.newFolder('summon')
				.chainNewFile('as_root.mcfunction', [
					// Default argument values
					`execute unless score #variant ${scoreboard.i} = #variant ${
						scoreboard.i
					} run scoreboard players set #variant ${scoreboard.i} ${variants.findIndex(
						v => v.default
					)}`,

					`scoreboard players set @s ${scoreboard.rigLoaded} 1`,
					`scoreboard players operation @s ${scoreboard.exportVersion} = .aj.export_version ${scoreboard.i}`,
					`execute store result score @s ${scoreboard.id} run scoreboard players add .aj.last_id ${scoreboard.id} 1`,
					`tp @s ~ ~ ~ ~ ~`,
					`execute at @s on passengers run function ${AJ_NAMESPACE}:summon/as_bone`,
					...variants.map(
						v =>
							`execute if score #variant ${scoreboard.i} = $aj.${NAMESPACE}.variant.${v.name} ${scoreboard.id} run function ${AJ_NAMESPACE}:apply_variant/${v.name}_as_root`
					),
					`execute at @s run function #${NAMESPACE}:on_summon`,
					`tag @s remove ${tags.new}`,
					// Reset scoreboard arguemnts
					`scoreboard players reset #variant ${scoreboard.i}`,
				])
				.chainNewFile('as_bone.mcfunction', [
					`scoreboard players operation @s ${scoreboard.id} = .aj.last_id ${scoreboard.id}`,
					`tag @s remove ${tags.new}`,
				])

			//--------------------------------------------
			// ANCHOR upgrade functions
			//--------------------------------------------
			if (outdatedRigWarningEnabled) {
				animatedJavaFolder
					.accessFolder('functions')
					.chainNewFile('upgrade_rig.mcfunction', [
						`scoreboard players operation @s ${scoreboard.exportVersion} = .aj.export_version ${scoreboard.i}`,
						`execute on passengers run data modify entity @s Glowing set value 1`,
						`execute on passengers run data modify entity @s glow_color_override set value 16711680`,
						`tellraw @a ${errorOutOfDateRig}`,
					])
			}

			//--------------------------------------------
			// ANCHOR remove functions
			//--------------------------------------------

			namespaceFolder
				.newFolder('functions/remove')
				.chainNewFile('this.mcfunction', [
					`execute if entity @s[tag=${tags.rootEntity}] run function ${AJ_NAMESPACE}:remove/as_root`,
					`execute if entity @s[tag=!${tags.rootEntity}] run tellraw @a ${API.formatStr(
						errorMustBeRunAsRoot.toString(),
						[`${NAMESPACE}:remove/this`]
					)}`,
				])
				.chainNewFile('all.mcfunction', [
					`execute as @e[type=#${NAMESPACE}:aj_root,tag=${tags.rootEntity}] run function ${AJ_NAMESPACE}:remove/as_root`,
				])

			animatedJavaFolder
				.newFolder('functions/remove')
				.chainNewFile('as_root.mcfunction', [
					`execute at @s run function #${NAMESPACE}:on_remove`,
					`execute on passengers run kill @s`,
					`kill @s`,
				])

			//--------------------------------------------
			// ANCHOR variant functions
			//--------------------------------------------

			const applyVariantFolder = namespaceFolder.newFolder('functions/apply_variant')
			const ajApplyVariantFolder = animatedJavaFolder.newFolder('functions/apply_variant')

			for (const variant of variants) {
				applyVariantFolder.newFile(`${variant.name}.mcfunction`, [
					`execute if entity @s[tag=${tags.rootEntity}] run function ${AJ_NAMESPACE}:apply_variant/${variant.name}_as_root`,
					`execute if entity @s[tag=!${tags.rootEntity}] run tellraw @a ${API.formatStr(
						errorMustBeRunAsRoot.toString(),
						[`${NAMESPACE}:apply_variant/${variant.name}`]
					)}`,
				])

				ajApplyVariantFolder.newFile(`${variant.name}_as_root.mcfunction`, [
					`execute on passengers run function ${AJ_NAMESPACE}:apply_variant/${variant.name}_as_bone`,
				])

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
						`execute if entity @s[tag=${API.formatStr(tags.boneEntity, [
							bone.name,
						])}] run data modify entity @s item.tag.CustomModelData set value ${
							variantBone.customModelData
						}`
					)
				}
				ajApplyVariantFolder.newFile(`${variant.name}_as_bone.mcfunction`, commands)
			}

			//--------------------------------------------
			// ANCHOR Export Data Pack
			//--------------------------------------------

			const DATAPACK_EXPORT_PATH = PathModule.join(EXPORT_FOLDER, NAMESPACE)
			const ajMetaPath = PathModule.join(DATAPACK_EXPORT_PATH, 'animated_java.mcmeta')

			const progress = new API.ProgressBarController(
				'Writing Data Pack to disk...',
				datapack.childCount
			)

			if (await fileExists(ajMetaPath)) {
				const content = await fs.promises.readFile(ajMetaPath, 'utf-8').then(JSON.parse)
				if (content.project_namespace !== NAMESPACE)
					throw new Error(
						`The datapack folder already contains a datapack with a different namespace: ${
							content.project_namespace as string
						}`
					)

				await fs.promises.rm(DATAPACK_EXPORT_PATH, { recursive: true })
			}

			await datapack.writeToDisk(EXPORT_FOLDER, progress)
			progress.finish()
			console.log('Export Complete!')
		},
	})
}
