// @ts-ignore
import en from './lang/en.yaml'

type IFrameLeaf = AnimatedJava.ITreeLeaf<AnimatedJava.IRenderedAnimation['frames'][any]>
type IFrameBranch = AnimatedJava.ITreeBranch<AnimatedJava.IRenderedAnimation['frames'][any]>
type IFrameTree = IFrameBranch | IFrameLeaf

function getExportVersionId() {
	return Math.round(Math.random() * 2 ** 31 - 1 - (Math.random() * 2 ** 31 - 1))
}

export function loadExporter() {
	const API = AnimatedJava.API
	const { NbtTag, NbtCompound, NbtString, NbtList, NbtInt, NbtFloat } = AnimatedJava.API.deepslate

	API.addTranslations('en', en as Record<string, string>)

	const TRANSLATIONS = {
		datapack_folder: {
			name: API.translate('animated_java.animation_exporter.settings.datapack_folder'),
			description: API.translate(
				'animated_java.animation_exporter.settings.datapack_folder.description'
			).split('\n'),
			error: {
				unset: API.translate(
					'animated_java.animation_exporter.settings.datapack_folder.error.unset'
				),
			},
		},
		interpolation_duration: {
			name: API.translate('animated_java.animation_exporter.settings.interpolation_duration'),
			description: API.translate(
				'animated_java.animation_exporter.settings.interpolation_duration.description'
			).split('\n'),
		},
		outdated_rig_warning: {
			name: API.translate('animated_java.animation_exporter.settings.outdated_rig_warning'),
			description: API.translate(
				'animated_java.animation_exporter.settings.outdated_rig_warning.description'
			).split('\n'),
		},
		include_convenience_functions: {
			name: API.translate(
				'animated_java.animation_exporter.settings.include_convenience_functions'
			),
			description: API.translate(
				'animated_java.animation_exporter.settings.include_convenience_functions.description'
			).split('\n'),
		},
		root_entity_nbt: {
			name: API.translate('animated_java.animation_exporter.settings.root_entity_nbt'),
			description: API.translate(
				'animated_java.animation_exporter.settings.root_entity_nbt.description'
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
		id: 'animated_java:animation_exporter',
		name: API.translate('animated_java.animation_exporter.name'),
		description: API.translate('animated_java.animation_exporter.description'),
		getSettings() {
			return {
				datapack_folder: new API.Settings.FolderSetting(
					{
						id: 'animated_java:animation_exporter/datapack_folder',
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
				interpolation_duration: new API.Settings.NumberSetting({
					id: 'animated_java:animation_exporter/interpolation_duration',
					displayName: TRANSLATIONS.interpolation_duration.name,
					description: TRANSLATIONS.interpolation_duration.description,
					defaultValue: 1,
					min: 0,
					step: 1,
					resettable: true,
				}),
				outdated_rig_warning: new API.Settings.CheckboxSetting({
					id: 'animated_java:animation_exporter/outdated_rig_warning',
					displayName: TRANSLATIONS.outdated_rig_warning.name,
					description: TRANSLATIONS.outdated_rig_warning.description,
					defaultValue: true,
				}),
				include_convenience_functions: new API.Settings.CheckboxSetting({
					id: 'animated_java:animation_exporter/include_convenience_functions',
					displayName: TRANSLATIONS.include_convenience_functions.name,
					description: TRANSLATIONS.include_convenience_functions.description,
					defaultValue: true,
				}),
				root_entity_nbt: new API.Settings.CodeboxSetting(
					{
						id: 'animated_java:animation_exporter/root_entity_nbt',
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
				settingId: 'animated_java:animation_exporter/datapack_folder',
			},
			{
				type: 'setting',
				settingId: 'animated_java:animation_exporter/interpolation_duration',
			},
			{
				type: 'setting',
				settingId: 'animated_java:animation_exporter/outdated_rig_warning',
			},
			{
				type: 'setting',
				settingId: 'animated_java:animation_exporter/include_convenience_functions',
			},
			{
				type: 'setting',
				settingId: 'animated_java:animation_exporter/root_entity_nbt',
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
				tweenTime: 'aj.tween_time',
				animTime: 'aj.anim_time',
				lifeTime: 'aj.life_time',
				loopMode: 'aj.loop_mode',
				exportVersion: `aj.export_version`,
				rigLoaded: `aj.${NAMESPACE}.rig_loaded`,
				localAnimTime: `aj.animation.%s.local_anim_time`,
			}
			const tags = {
				new: 'aj.new',
				rootEntity: `aj.${NAMESPACE}.root`,
				boneEntity: `aj.${NAMESPACE}.bone.%s`,
				activeAnim: `aj.${NAMESPACE}.animation.%s`,
				activeVariant: `aj.${NAMESPACE}.variant.%s`,
				cameraTag: `aj.${NAMESPACE}.camera.%s`,
				locatorTag: `aj.${NAMESPACE}.locator.%s`,
			}
			const entity_types = {
				ajRoot: `#${NAMESPACE}:aj_root`,
				ajBone: `#${NAMESPACE}:aj_bone`,
			}
			const loopModes = ['loop', 'once', 'hold']

			const datapack = new API.VirtualFileSystem.VirtualFolder(NAMESPACE)
			const dataFolder = datapack.newFolder('data')

			datapack
				.chainNewFile('animated_java.mcmeta', {
					project_namespace: NAMESPACE,
				})
				.chainNewFile('pack.mcmeta', {
					pack: {
						pack_format: 12, // 12 since 1.19.4
						description: `"${NAMESPACE}" A Data Pack generated by Animated Java using the Animation Exporter.`,
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
					...renderedAnimations.map(a => `scoreboard objectives add ${API.formatStr(scoreboard.localAnimTime, [a.name])} dummy`),
					// prettier-ignore
					...renderedAnimations.map((a, i) => `scoreboard players set $aj.${NAMESPACE}.animation.${a.name} ${scoreboard.id} ${i}`),
					// prettier-ignore
					...variants.map((v, i) => `scoreboard players set $aj.${NAMESPACE}.variant.${v.name} ${scoreboard.id} ${i}`),
					// Variable initialization
					`scoreboard players add .aj.last_id ${scoreboard.id} 0`,
					`scoreboard players set $aj.default_interpolation_duration ${scoreboard.i} ${exporterSettings.interpolation_duration.value}`,
					// prettier-ignore
					...loopModes.map((mode, i) => `scoreboard players set $aj.loop_mode.${mode} ${scoreboard.i} ${i}`),
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
					`scoreboard players add @s ${scoreboard.lifeTime} 1`,
					`execute at @s on passengers run tp @s ~ ~ ~ ~180 ~`,
					`function #${NAMESPACE}:on_tick`,
					`function ${AJ_NAMESPACE}:animations/tick`,
				])

			//--------------------------------------------
			// ANCHOR uninstall function
			//--------------------------------------------

			namespaceFolder.accessFolder('functions').chainNewFile('uninstall.mcfunction', [
				// Scoreboard objectives
				...Object.values(scoreboard)
					.filter(s => !s.includes('%s'))
					.map(s => `scoreboard objectives remove ${s}`),
				// prettier-ignore
				...renderedAnimations.map(a => `scoreboard objectives remove ${API.formatStr(scoreboard.localAnimTime, [a.name])}`),
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
					.set(
						'interpolation_duration',
						new NbtInt(exporterSettings.interpolation_duration.value)
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
					`execute unless score #frame ${scoreboard.i} = #frame ${scoreboard.i} run scoreboard players set #frame ${scoreboard.i} 0`,
					`execute unless score #variant ${scoreboard.i} = #variant ${
						scoreboard.i
					} run scoreboard players set #variant ${scoreboard.i} ${variants.findIndex(
						v => v.default
					)}`,
					`execute unless score #animation ${scoreboard.i} = #animation ${scoreboard.i} run scoreboard players set #animation ${scoreboard.i} -1`,

					`scoreboard players set @s ${scoreboard.animTime} 0`,
					`scoreboard players set @s ${scoreboard.rigLoaded} 1`,
					`scoreboard players operation @s ${scoreboard.exportVersion} = .aj.export_version ${scoreboard.i}`,
					`execute store result score @s ${scoreboard.id} run scoreboard players add .aj.last_id ${scoreboard.id} 1`,
					`tp @s ~ ~ ~ ~ ~`,
					`execute at @s on passengers run function ${AJ_NAMESPACE}:summon/as_bone`,
					...variants.map(
						v =>
							`execute if score #variant ${scoreboard.i} = $aj.${NAMESPACE}.variant.${v.name} ${scoreboard.id} run function ${AJ_NAMESPACE}:apply_variant/${v.name}_as_root`
					),
					`execute if score #animation ${scoreboard.i} matches 0.. run scoreboard players operation @s ${scoreboard.animTime} = #frame ${scoreboard.i}`,
					...renderedAnimations
						.map(a => [
							`execute if score #animation ${scoreboard.i} = $aj.${NAMESPACE}.animation.${a.name} ${scoreboard.id} run function ${AJ_NAMESPACE}:animations/${a.name}/apply_frame_as_root`,
							`execute if score #animation ${
								scoreboard.i
							} = $aj.${NAMESPACE}.animation.${a.name} ${
								scoreboard.id
							} run scoreboard players operation @s ${API.formatStr(
								scoreboard.localAnimTime,
								[a.name]
							)} = #frame ${scoreboard.i}`,
						])
						.reduce((a, b) => a.concat(b), []),
					`execute at @s run function #${NAMESPACE}:on_summon`,
					`tag @s remove ${tags.new}`,
					// Reset scoreboard arguemnts
					`scoreboard players reset #frame ${scoreboard.i}`,
					`scoreboard players reset #variant ${scoreboard.i}`,
					`scoreboard players reset #animation ${scoreboard.i}`,
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
			// ANCHOR animation functions
			//--------------------------------------------

			// External functions
			for (const anim of renderedAnimations) {
				const animFolder = namespaceFolder.newFolder(`functions/animations/${anim.name}`)
				for (const name of [
					'play',
					'resume',
					'pause',
					'stop',
					'apply_frame',
					'tween_play',
					'tween_resume',
				]) {
					animFolder.newFile(`${name}.mcfunction`, [
						`execute if entity @s[tag=${tags.rootEntity}] run function ${AJ_NAMESPACE}:animations/${anim.name}/${name}_as_root`,
						`execute if entity @s[tag=!${
							tags.rootEntity
						}] run tellraw @a ${API.formatStr(errorMustBeRunAsRoot.toString(), [
							`${NAMESPACE}:animations/${anim.name}/${name}`,
						])}`,
					])
				}
			}

			// Tree building helpers
			function getBranchFileName(branch: IFrameBranch) {
				return `branch_${branch.minScoreIndex}_${branch.maxScoreIndex}`
			}

			function getRootLeafFileName(frame: IFrameLeaf) {
				return `leaf_${frame.scoreIndex}`
			}

			function getNodeLeafFileName(frame: IFrameLeaf) {
				return `leaf_${frame.scoreIndex}_as_bone`
			}

			function generateRootLeafFunction(
				frameTreeFolder: AnimatedJava.VirtualFolder,
				animName: string,
				leaf: IFrameLeaf
			) {
				const commands: string[] = []
				commands.push(
					`execute on passengers run function ${AJ_NAMESPACE}:animations/${animName}/tree/${getNodeLeafFileName(
						leaf
					)}`
				)
				if (!(leaf.item.commands || leaf.item.variant)) return commands

				const functions: Record<string, string[]> = {}

				if (leaf.item.commands) {
					const condition = leaf.item.commands.executeCondition
					const commands = leaf.item.commands.commands.split('\n')
					if (!functions[condition]) functions[condition] = []
					functions[condition].push(...commands)
				}

				if (leaf.item.variant) {
					const variant = variants.find(v => v.uuid === leaf.item.variant.uuid)
					let command = `function ${AJ_NAMESPACE}:apply_variant/${variant.name}_as_root`
					const condition = leaf.item.variant.executeCondition
					if (!functions[condition]) functions[condition] = []
					functions[condition].push(command)
				}

				for (const [condition, cmds] of Object.entries(functions)) {
					if (cmds.length === 0) continue
					if (cmds.length === 1) {
						if (condition) commands.push(`execute ${condition} run ${cmds[0]}`)
						else commands.push(cmds[0])
						continue
					}
					const index = Object.keys(functions).indexOf(condition)
					frameTreeFolder.newFile(
						`${getRootLeafFileName(leaf)}_effects_${index}.mcfunction`,
						cmds
					)
					let command = `function ${AJ_NAMESPACE}:animations/${animName}/tree/${getRootLeafFileName(
						leaf
					)}_effects_${index}`
					commands.push(condition ? `execute ${condition} run ${command}` : command)
				}

				return commands
			}

			function generateNodeLeafFunction(leaf: IFrameLeaf) {
				const commands: string[] = []
				for (const node of Object.values(leaf.item.nodes)) {
					switch (node.type) {
						case 'bone': {
							const data = new NbtCompound()
								.set(
									'transformation',
									// transformationToNbt(bone.pos, bone.rot, bone.scale)
									matrixToNbtFloatArray(node.matrix)
								)
								.set('start_interpolation', new NbtInt(0))
							commands.push(
								`execute if entity @s[tag=${API.formatStr(tags.boneEntity, [
									node.name,
								])}] run data modify entity @s {} merge value ${data}`
							)
							break
						}
						case 'camera': {
							const pos = node.pos
							const euler = new THREE.Euler().setFromQuaternion(node.rot, 'YZX')
							const rot = new THREE.Vector3(euler.x, euler.y, euler.z).multiplyScalar(
								180 / Math.PI
							)
							commands.push(
								`execute if entity @s[tag=${API.formatStr(tags.boneEntity, [
									node.name,
								])}] at @s run tp @e[tag=${API.formatStr(tags.cameraTag, [
									node.name,
								])}] ^${API.roundToN(pos.x, 10)} ^${API.roundToN(
									pos.y - 1.62,
									10
								)} ^${API.roundToN(pos.z, 10)} ~${API.roundToN(
									-rot.y + 180,
									10
								)} ~${API.roundToN(-rot.x, 10)}`
							)
							break
						}
						case 'locator': {
							commands.push(
								`execute if entity @s[tag=${API.formatStr(tags.boneEntity, [
									node.name,
								])}] at @s run tp @e[tag=${API.formatStr(tags.locatorTag, [
									node.name,
								])}] ^${API.roundToN(node.pos.x, 10)} ^${API.roundToN(
									node.pos.y,
									10
								)} ^${API.roundToN(node.pos.z, 10)} ~ ~`
							)
							break
						}
					}
				}
				return commands
			}

			function buildFrameTree(
				anim: AnimatedJava.IRenderedAnimation,
				frameTree: IFrameTree,
				frameTreeFolder: AnimatedJava.VirtualFolder
			) {
				function recurse(tree: IFrameTree): string {
					if (tree.type === 'branch') {
						const content: string[] = []
						for (const item of tree.items) {
							content.push(recurse(item))
						}
						frameTreeFolder.newFile(getBranchFileName(tree) + '.mcfunction', content)

						return `execute if score @s ${scoreboard.animTime} matches ${
							tree.minScoreIndex
						}..${tree.maxScoreIndex} run function ${AJ_NAMESPACE}:animations/${
							anim.name
						}/tree/${getBranchFileName(tree)}`
					}

					frameTreeFolder.newFile(
						getRootLeafFileName(tree) + '.mcfunction',
						generateRootLeafFunction(frameTreeFolder, anim.name, tree)
					)

					frameTreeFolder.newFile(
						getNodeLeafFileName(tree) + '.mcfunction',
						generateNodeLeafFunction(tree)
					)

					return `execute if score @s ${scoreboard.animTime} matches ${
						tree.scoreIndex
					} run function ${AJ_NAMESPACE}:animations/${
						anim.name
					}/tree/${getRootLeafFileName(tree)}`
				}
				return recurse(frameTree)
			}

			// functions
			animatedJavaFolder
				.newFolder('functions/animations')
				.chainNewFile('tick.mcfunction', [
					...renderedAnimations.map(
						anim =>
							`execute if entity @s[tag=${API.formatStr(tags.activeAnim, [
								anim.name,
							])}] run function ${AJ_NAMESPACE}:animations/${anim.name}/tick`
					),
				])

			for (const anim of renderedAnimations) {
				const animFolder = animatedJavaFolder
					.newFolder(`functions/animations/${anim.name}`)
					.chainNewFile('play_as_root.mcfunction', [
						`scoreboard players set @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} 0`,
						`scoreboard players set @s ${scoreboard.loopMode} ${loopModes.indexOf(
							anim.loopMode
						)}`,
						`scoreboard players operation @s ${scoreboard.animTime} = ${API.formatStr(
							scoreboard.localAnimTime,
							[anim.name]
						)}`,
						`execute on passengers run data modify entity @s interpolation_duration set value 0`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/tree/leaf_0`,
						`execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${scoreboard.i}`,
						`tag @s add ${API.formatStr(tags.activeAnim, [anim.name])}`,
					])
					.chainNewFile('resume_as_root.mcfunction', [
						`scoreboard players set @s ${scoreboard.loopMode} ${loopModes.indexOf(
							anim.loopMode
						)}`,
						`execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${scoreboard.i}`,
						`tag @s add ${API.formatStr(tags.activeAnim, [anim.name])}`,
					])
					.chainNewFile('pause_as_root.mcfunction', [
						`tag @s remove ${API.formatStr(tags.activeAnim, [anim.name])}`,
					])
					.chainNewFile('stop_as_root.mcfunction', [
						`scoreboard players set @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} 0`,
						`tag @s remove ${API.formatStr(tags.activeAnim, [anim.name])}`,
						`execute on passengers run data modify entity @s interpolation_duration set value 0`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/tree/leaf_0`,
					])
					.chainNewFile('tween_play_as_root.mcfunction', [
						`function ${AJ_NAMESPACE}:animations/${anim.name}/play_as_root`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/tween_as_root`,
						`execute if score #tween_duration ${scoreboard.i} matches ..0 on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${scoreboard.i}`,
						`scoreboard players reset #tween_duration ${scoreboard.i}`,
					])
					.chainNewFile('tween_resume_as_root.mcfunction', [
						`function ${AJ_NAMESPACE}:animations/${anim.name}/resume_as_root`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/tween_as_root`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/apply_frame_as_root`,
						`execute if score #tween_duration ${scoreboard.i} matches ..0 on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${scoreboard.i}`,
						`scoreboard players reset #tween_duration ${scoreboard.i}`,
					])
					.chainNewFile('tween_as_root.mcfunction', [
						`execute unless score #tween_duration ${scoreboard.i} = #tween_duration ${scoreboard.i} run scoreboard players operation #tween_duration ${scoreboard.i} = $aj.default_interpolation_duration ${scoreboard.i}`,
						`scoreboard players operation @s ${scoreboard.tweenTime} = #tween_duration ${scoreboard.i}`,
						`execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get #tween_duration ${scoreboard.i}`,
						`scoreboard players remove @s ${scoreboard.tweenTime} 1`,
					])
					.chainNewFile('tick.mcfunction', [
						`execute if score @s ${scoreboard.tweenTime} matches 1.. run function ${AJ_NAMESPACE}:animations/${anim.name}/tick_tween`,
						`execute unless score @s ${scoreboard.tweenTime} matches 1.. run function ${AJ_NAMESPACE}:animations/${anim.name}/tick_animation`,
						// `function ${AJ_NAMESPACE}:animations/${anim.name}/tick_animation`,
					])
					.chainNewFile('tick_tween.mcfunction', [
						`scoreboard players remove @s ${scoreboard.tweenTime} 1`,
						// `scoreboard players operation #t ${scoreboard.i} = @s ${scoreboard.tweenTime}`,
						// `execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get #t ${scoreboard.i}`,
						`execute if score @s ${scoreboard.tweenTime} matches ..0 on passengers store result entity @s interpolation_duration int 1 run scoreboard players get $aj.default_interpolation_duration ${scoreboard.i}`,
					])
					.chainNewFile('tick_animation.mcfunction', [
						`scoreboard players operation @s ${
							scoreboard.animTime
						} = @s ${API.formatStr(scoreboard.localAnimTime, [anim.name])}`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/apply_frame_as_root`,
						`scoreboard players add @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} 1`,
						`execute if score @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} matches ${
							anim.duration - 1
						}.. run function ${AJ_NAMESPACE}:animations/${anim.name}/end`,
					])
					.chainNewFile('end.mcfunction', [
						`execute if score @s ${
							scoreboard.loopMode
						} = $aj.loop_mode.loop aj.i run scoreboard players set @s ${API.formatStr(
							scoreboard.localAnimTime,
							[anim.name]
						)} 0`,
						`execute if score @s ${scoreboard.loopMode} = $aj.loop_mode.once aj.i run function ${NAMESPACE}:animations/${anim.name}/stop`,
						`execute if score @s ${scoreboard.loopMode} = $aj.loop_mode.hold aj.i run function ${NAMESPACE}:animations/${anim.name}/pause`,
					])

				const tree = API.generateSearchTree(anim.frames, item => {
					if (item.type === 'branch') return item.items.length > 0
					if (item.type === 'leaf') return item.item.nodes.length > 0
					return false
				})
				animFolder.newFile(
					'apply_frame_as_root.mcfunction',
					buildFrameTree(anim, tree, animFolder.newFolder('tree'))
				)
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
