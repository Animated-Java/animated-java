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
	const { NbtCompound, NbtString, NbtList, NbtInt, NbtFloat } = AnimatedJava.API.deepslate

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
			// Settings
			//--------------------------------------------
			const NAMESPACE = projectSettings.project_namespace.value
			const RIG_ITEM = projectSettings.rig_item.value
			const EXPORT_FOLDER = exporterSettings.datapack_folder.value
			const variants = Project.animated_java_variants.variants
			const outdatedRigWarningEnabled = exporterSettings.outdated_rig_warning.value

			//--------------------------------------------
			// Data Pack
			//--------------------------------------------

			const scoreboard = {
				i: 'aj.i',
				id: 'aj.id',
				exportVersion: `aj.export_version`,
				animTime: 'aj.anim_time',
				lifeTime: 'aj.life_time',
				loopMode: 'aj.loop_mode',
				localAnimTime: `aj.%s.local_anim_time`,
				rigLoaded: `aj.${NAMESPACE}.rig_loaded`,
			}
			const tags = {
				new: 'aj.new',
				rootEntity: `aj.${NAMESPACE}.root`,
				boneEntity: `aj.${NAMESPACE}.bone.%s`,
				activeAnim: `aj.${NAMESPACE}.animation.%s`,
				activeVariant: `aj.${NAMESPACE}.variant.%s`,
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
			// minecraft function tags
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
			// entity_type tags
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
			// function tags
			//--------------------------------------------

			namespaceFolder
				.newFolder('tags/functions')
				.chainNewFile('on_summon.json', {
					replace: false,
					values: [
						outdatedRigWarningEnabled
							? `${AJ_NAMESPACE}:check_if_updating_rig_on_summon`
							: undefined,
					],
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
					values: [
						outdatedRigWarningEnabled
							? `${AJ_NAMESPACE}:check_if_updating_rig_on_remove`
							: undefined,
					],
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
					// Variable initialization
					`scoreboard players add .aj.last_id ${scoreboard.id} 0`,
					//// Const initialization
					`scoreboard players set #aj.default_interpolation_duration ${scoreboard.i} ${exporterSettings.interpolation_duration.value}`,
					`scoreboard players set #aj.loop_mode.loop ${scoreboard.i} ${loopModes.indexOf(
						'loop'
					)}`,
					`scoreboard players set #aj.loop_mode.once ${scoreboard.i} ${loopModes.indexOf(
						'once'
					)}`,
					`scoreboard players set #aj.loop_mode.hold ${scoreboard.i} ${loopModes.indexOf(
						'hold'
					)}`,
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
					`say Loaded!`,
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
			// uninstall function
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

			const summonNbt = new NbtCompound()
			summonNbt.set(
				'Tags',
				new NbtList([new NbtString(tags.new), new NbtString(tags.rootEntity)])
			)

			const passengers = new NbtList()
			for (const [uuid, bone] of Object.entries(rig.boneMap)) {
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
					.set(
						'transformation',
						// transformationToNbt(pose.pos, pose.rot, pose.scale)
						matrixToNbtFloatArray(pose.matrix)
					)
					.set(
						'interpolation_duration',
						new NbtInt(exporterSettings.interpolation_duration.value)
					)
				passengers.add(passenger)
			}
			summonNbt.set('Passengers', passengers)

			const variantSummonFolder = namespaceFolder
				.accessFolder('functions')
				.chainNewFile('summon.mcfunction', [
					`scoreboard players set .aj.variant_id ${scoreboard.i} ${variants.findIndex(
						v => v.default
					)}`,
					`function ${AJ_NAMESPACE}:summon`,
				])
				.chainNewFile('summon_variable_variant.mcfunction', [
					`function ${AJ_NAMESPACE}:summon`,
				])
				.newFolder('summon')

			for (const variant of variants) {
				if (variant.default) continue
				variantSummonFolder.newFile(`${variant.name}.mcfunction`, [
					`scoreboard players set .aj.variant_id ${scoreboard.i} ${variants.indexOf(
						variant
					)}`,
					`function ${AJ_NAMESPACE}:summon`,
				])
			}

			animatedJavaFolder
				.accessFolder('functions')
				.chainNewFile('summon.mcfunction', [
					`summon minecraft:item_display ~ ~ ~ ${summonNbt.toString()}`,
					`execute as @e[type=#${NAMESPACE}:aj_root,limit=1,distance=..1,tag=${tags.new}] at @s run function ${AJ_NAMESPACE}:summon/as_root`,
				])
				.newFolder('summon')
				.chainNewFile('as_root.mcfunction', [
					`scoreboard players set @s ${scoreboard.rigLoaded} 1`,
					`scoreboard players operation @s ${scoreboard.exportVersion} = .aj.export_version ${scoreboard.i}`,
					`execute store result score @s ${scoreboard.id} run scoreboard players add .aj.last_id ${scoreboard.id} 1`,
					`execute on passengers run function ${AJ_NAMESPACE}:summon/as_bone`,
					...variants.map(
						(v, i) =>
							`execute if score .aj.variant_id ${scoreboard.i} matches ${i} run function ${AJ_NAMESPACE}:apply_variant/${v.name}_as_root`
					),
					`function #${NAMESPACE}:on_summon`,
					`tag @s remove ${tags.new}`,
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
			// variant functions
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
				for (const [uuid, bone] of Object.entries(rig.boneMap)) {
					const included = variant.affectedBones.find(v => v.value === uuid)
					if (
						(!included && variant.affectedBonesIsAWhitelist) ||
						(included && !variant.affectedBonesIsAWhitelist)
					)
						continue

					let variantBone: AnimatedJava.IRenderedBoneVariant
					if (variant.default) {
						variantBone = rig.boneMap[uuid]
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
			// animation functions
			//--------------------------------------------

			// External functions
			for (const anim of renderedAnimations) {
				namespaceFolder
					.newFolder(`functions/animations/${anim.name}`)
					.chainNewFile('play.mcfunction', [
						`scoreboard players set @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} 0`,
						`scoreboard players set @s ${scoreboard.loopMode} ${loopModes.indexOf(
							anim.loopMode
						)}`,
						`execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get #aj.default_interpolation_duration ${scoreboard.i}`,
						`tag @s add ${API.formatStr(tags.activeAnim, [anim.name])}`,
					])
					.chainNewFile('resume.mcfunction', [
						`scoreboard players set @s ${scoreboard.loopMode} ${loopModes.indexOf(
							anim.loopMode
						)}`,
						`execute on passengers store result entity @s interpolation_duration int 1 run scoreboard players get #aj.default_interpolation_duration ${scoreboard.i}`,
						`tag @s add ${API.formatStr(tags.activeAnim, [anim.name])}`,
					])
					.chainNewFile('pause.mcfunction', [
						`tag @s remove ${API.formatStr(tags.activeAnim, [anim.name])}`,
					])
					.chainNewFile('stop.mcfunction', [
						`scoreboard players set @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} 0`,
						`tag @s remove ${API.formatStr(tags.activeAnim, [anim.name])}`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/tree/leaf_0.mcfunction`,
					])
					.chainNewFile('apply_frame.mcfunction', [
						// Applies the a frame of the animation to the entity based on aj.anim_time.
						`function ${AJ_NAMESPACE}:animations/${anim.name}/apply_frame`,
					])
			}

			// Internal functions
			// Tree building helpers
			function getBranchFileName(branch: IFrameBranch) {
				return `branch_${branch.minScoreIndex}_${branch.maxScoreIndex}`
			}

			function getRootLeafFileName(frame: IFrameLeaf) {
				return `leaf_${frame.scoreIndex}`
			}

			function getBoneLeafFileName(frame: IFrameLeaf) {
				return `leaf_${frame.scoreIndex}_as_bone`
			}

			function generateRootLeafFunction(
				frameTreeFolder: AnimatedJava.VirtualFolder,
				animName: string,
				leaf: IFrameLeaf
			) {
				const commands: string[] = []
				commands.push(
					`execute on passengers run function ${AJ_NAMESPACE}:animations/${animName}/tree/${getBoneLeafFileName(
						leaf
					)}`
				)

				if (leaf.item.commands) {
					frameTreeFolder.newFile(
						getRootLeafFileName(leaf) + '_commands.mcfunction',
						leaf.item.commands.commands.split('\n')
					)
					let command = `function ${AJ_NAMESPACE}:animations/${animName}/tree/${getRootLeafFileName(
						leaf
					)}_commands`
					if (leaf.item.commands.executeCondition)
						command = `execute ${leaf.item.commands.executeCondition.trim()} run ${command}`
					commands.push(command)
				}

				if (leaf.item.variant) {
					const variant = variants.find(v => v.uuid === leaf.item.variant.uuid)
					let command = `function ${AJ_NAMESPACE}:apply_variant/${variant.name}_as_root`
					if (leaf.item.variant.executeCondition)
						command = `execute ${leaf.item.variant.executeCondition.trim()} run ${command}`
					commands.push(command)
				}
				// TODO - Add animation state functionality here
				return commands
			}

			function generateBoneLeafFunction(leaf: IFrameLeaf) {
				const commands: string[] = []
				for (const bone of Object.values(leaf.item.bones)) {
					const data = new NbtCompound()
						.set(
							'transformation',
							// transformationToNbt(bone.pos, bone.rot, bone.scale)
							matrixToNbtFloatArray(bone.matrix)
						)
						.set('start_interpolation', new NbtInt(0))
					commands.push(
						`execute if entity @s[tag=${API.formatStr(tags.boneEntity, [
							bone.name,
						])}] run data modify entity @s {} merge value ${data}`
					)
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
						getBoneLeafFileName(tree) + '.mcfunction',
						generateBoneLeafFunction(tree)
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
				const animFolder = animatedJavaFolder.newFolder(`functions/animations/${anim.name}`)

				animFolder
					.chainNewFile('tick.mcfunction', [
						`scoreboard players operation @s ${
							scoreboard.animTime
						} = @s ${API.formatStr(scoreboard.localAnimTime, [anim.name])}`,
						`function ${AJ_NAMESPACE}:animations/${anim.name}/apply_frame`,
						`scoreboard players add @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} 1`,
						`execute if score @s ${API.formatStr(scoreboard.localAnimTime, [
							anim.name,
						])} matches ${anim.duration}.. run function ${AJ_NAMESPACE}:animations/${
							anim.name
						}/end`,
					])
					.chainNewFile('end.mcfunction', [
						`execute if score @s ${
							scoreboard.loopMode
						} = #aj.loop_mode.loop aj.i run scoreboard players set @s ${API.formatStr(
							scoreboard.localAnimTime,
							[anim.name]
						)} 0`,
						`execute if score @s ${scoreboard.loopMode} = #aj.loop_mode.once aj.i run function ${NAMESPACE}:animations/${anim.name}/stop`,
						`execute if score @s ${scoreboard.loopMode} = #aj.loop_mode.hold aj.i run function ${NAMESPACE}:animations/${anim.name}/pause`,
					])

				// console.log(anim.name)
				const tree = API.generateSearchTree(anim.frames, item => {
					if (item.type === 'branch') return item.items.length > 0

					if (item.type === 'leaf') return item.item.bones.length > 0

					return false
				})
				// console.log(anim.name, tree)
				const frameTreeFolder = animFolder.newFolder('tree')
				const applyFrameFile = animFolder.newFile(
					'apply_frame.mcfunction',
					buildFrameTree(anim, tree, frameTreeFolder)
				)
			}

			//--------------------------------------------
			// Export Data Pack
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
