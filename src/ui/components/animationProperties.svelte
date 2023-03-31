<script lang="ts" context="module">
	import { onDestroy } from 'svelte'
	import { safeFunctionName } from '../../minecraft/util'
	import * as AJ from '../../settings'
	import type { GUIStructure } from '../../guiStructure'
	import UiNode from './settingNode.svelte'
	import { translate } from '../../util/translation'

	const TRANSLATIONS = {
		name: {
			displayName: translate('animated_java.animation_config.animation_name'),
			description: translate(
				'animated_java.animation_config.animation_name.description'
			).split('\n'),
			error: {
				duplicate_name: translate(
					'animated_java.animation_config.animation_name.error.duplicate_name'
				),
			},
		},
		loop: {
			displayName: translate('animated_java.animation_config.loop'),
			description: translate('animated_java.animation_config.loop.description').split('\n'),
			options: {
				once: translate('animated_java.animation_config.loop.options.once'),
				loop: translate('animated_java.animation_config.loop.options.loop'),
				hold: translate('animated_java.animation_config.loop.options.hold'),
			},
		},
		loop_delay: {
			displayName: translate('animated_java.animation_config.loop_delay'),
			description: translate('animated_java.animation_config.loop_delay.description').split(
				'\n'
			),
		},
		start_delay: {
			displayName: translate('animated_java.animation_config.start_delay'),
			description: translate('animated_java.animation_config.start_delay.description').split(
				'\n'
			),
		},
		affected_bones_is_a_whitelist: {
			displayName: translate('animated_java.animation_config.affected_bones_is_a_whitelist'),
			description: translate(
				'animated_java.animation_config.affected_bones_is_a_whitelist.description'
			).split('\n'),
		},
		affected_bones: {
			displayName: translate('animated_java.animation_config.affected_bones'),
			description: translate(
				'animated_java.animation_config.affected_bones.description'
			).split('\n'),
			addNewItemMessage: translate(
				'animated_java.animation_config.affected_bones.add_new_item_message'
			),
		},
	}
</script>

<script lang="ts">
	export let animation: _Animation
	let settings: Record<string, AJ.Setting<any>> = {}

	function getDefaultSettings() {
		return {
			name: new AJ.InlineTextSetting(
				{
					id: 'animated_java:animation_properties/name',
					displayName: TRANSLATIONS.name.displayName,
					description: TRANSLATIONS.name.description,
					defaultValue: 'new',
				},
				function onUpdate(setting) {
					setting.value = safeFunctionName(setting.value)

					if (
						Animator.animations.find(a => a.name === setting.value && a !== animation)
					) {
						setting.infoPopup = AJ.createInfo(
							'error',
							TRANSLATIONS.name.error.duplicate_name,
							{ name: setting.value }
						)
					}

					return setting
				}
			),
			loop: new AJ.DropdownSetting({
				id: 'animated_java:animation_properties/loop',
				displayName: TRANSLATIONS.loop.displayName,
				description: TRANSLATIONS.loop.description,
				defaultValue: 0,
				options: [
					{
						name: TRANSLATIONS.loop.options.once,
						value: 'once',
					},
					{
						name: TRANSLATIONS.loop.options.loop,
						value: 'loop',
					},
					{
						name: TRANSLATIONS.loop.options.hold,
						value: 'hold',
					},
				],
			}),
			loop_delay: new AJ.NumberSetting({
				id: 'animated_java:animation_properties/loop_delay',
				displayName: TRANSLATIONS.loop_delay.displayName,
				description: TRANSLATIONS.loop_delay.description,
				defaultValue: 0,
				min: 0,
				step: 1,
			}),
			start_delay: new AJ.NumberSetting({
				id: 'animated_java:animation_properties/start_delay',
				displayName: TRANSLATIONS.start_delay.displayName,
				description: TRANSLATIONS.start_delay.description,
				defaultValue: 0,
				min: 0,
				step: 1,
			}),
			affected_bones_is_a_whitelist: new AJ.CheckboxSetting({
				id: 'animated_java:animation_properties/affected_bones_is_a_whitelist',
				displayName: TRANSLATIONS.affected_bones_is_a_whitelist.displayName,
				description: TRANSLATIONS.affected_bones_is_a_whitelist.description,
				defaultValue: false,
			}),
			affected_bones: new AJ.ListBuilderSetting(
				{
					id: 'animated_java:animation_properties/affected_bones',
					displayName: TRANSLATIONS.affected_bones.displayName,
					description: TRANSLATIONS.affected_bones.description,
					addNewItemMessage: TRANSLATIONS.affected_bones.addNewItemMessage,
					defaultValue: [],
					options: [],
				},
				function onUpdate(setting) {
					setting.value
						.map(v => {
							const bone = Group.all.find(g => g.uuid === v.value)
							if (bone) v.name = bone.name
							else return undefined

							return v
						})
						.filter(v => v !== undefined)

					setting.options = Group.all
						.filter(g => !setting.value.find(v => v.value === g.uuid))
						.map(g => ({
							name: g.name,
							value: g.uuid,
						}))
					// console.log(setting.value)
				},
				function onInit(setting) {
					setting.onUpdate!(setting)
				}
			),
		}
	}

	const settingStructure: GUIStructure = [
		{
			type: 'setting',
			settingId: 'animated_java:animation_properties/name',
		},
		{
			type: 'setting',
			settingId: 'animated_java:animation_properties/loop',
		},
		{
			type: 'setting',
			settingId: 'animated_java:animation_properties/loop_delay',
		},
		{
			type: 'setting',
			settingId: 'animated_java:animation_properties/start_delay',
		},
		{
			type: 'setting',
			settingId: 'animated_java:animation_properties/affected_bones_is_a_whitelist',
		},
		{
			type: 'setting',
			settingId: 'animated_java:animation_properties/affected_bones',
		},
	]

	function loadAnimation() {
		settings = getDefaultSettings()
		if (animation.name === 'animation.model.new') animation.name = 'new'
		animation.createUniqueName(Animator.animations)
		animation.snapping = 20

		for (const [id, setting] of Object.entries(settings)) {
			switch (id) {
				case 'loop':
					const index = (setting as AJ.DropdownSetting).options.findIndex(
						o => o.value === animation[id]
					)
					setting.value = (index >= 0 && index) || setting.defaultValue
					break
				default:
					// @ts-ignore
					setting.value = animation[id]
					break
			}
		}
	}

	loadAnimation()

	const unsubs = Object.entries(settings).map(([key, s]) => {
		return s.subscribe(() => {
			switch (key) {
				case 'name':
					animation[key] = s.value
					animation.createUniqueName(Animator.animations)
					break
				case 'loop':
					animation[key] = (s as AJ.DropdownSetting).selected!.value
					break
				default:
					// @ts-ignore
					animation[key] = s.value
					break
			}
		})
	})

	onDestroy(() => {
		unsubs.forEach((u: any) => u())
	})
</script>

<div class="container">
	{#each settingStructure as el}
		<UiNode {el} settingArray={Object.values(settings)} />
	{/each}
</div>

<style>
	div.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: stretch;
	}
</style>
