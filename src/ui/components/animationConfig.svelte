<script lang="ts">
	import { onDestroy } from 'svelte'
	import { safeFunctionName } from '../../minecraft/util'
	import * as AJ from '../../settings'
	import { translate, translateInfo } from '../../translation'
	import type { GUIStructure } from '../uiStructure'
	import UiNode from './uiNode.svelte'

	export let animation: _Animation

	let settings: Record<string, AJ.Setting<any>> = {}

	function getDefaultSettings() {
		return {
			name: new AJ.InlineTextSetting(
				{
					id: 'animated_java:animation_name',
					displayName: translate('animated_java.animation_config.animation_name'),
					description: translate(
						'animated_java.animation_config.animation_name.description'
					).split('\n'),
					defaultValue: 'new',
				},
				function onUpdate(setting) {
					setting.value = safeFunctionName(setting.value)

					if (
						Animator.animations.find(
							anim => anim.name === setting.value && anim !== animation
						)
					)
						setting.infoPopup = translateInfo(
							'error',
							'animated_java.animation_config.animation_name.error.duplicate_name',
							{ name: setting.value }
						)

					return setting
				}
			),
			loop: new AJ.DropdownSetting({
				id: 'animated_java:animation_loop',
				displayName: translate('animated_java.animation_config.animation_loop'),
				description: translate(
					'animated_java.animation_config.animation_loop.description'
				).split('\n'),
				defaultValue: 0,
				options: [
					{
						name: translate(
							'animated_java.animation_config.animation_loop.options.once'
						),
						value: 'once',
					},
					{
						name: translate(
							'animated_java.animation_config.animation_loop.options.loop'
						),
						value: 'loop',
					},
					{
						name: translate(
							'animated_java.animation_config.animation_loop.options.hold'
						),
						value: 'hold',
					},
				],
			}),
			loop_delay: new AJ.NumberSetting({
				id: 'animated_java:animation_loop_delay',
				displayName: translate('animated_java.animation_config.animation_loop_delay'),
				description: translate(
					'animated_java.animation_config.animation_loop_delay.description'
				).split('\n'),
				defaultValue: 0,
				min: 0,
				step: 0.05,
			}),
			start_delay: new AJ.NumberSetting({
				id: 'animated_java:animation_start_delay',
				displayName: translate('animated_java.animation_config.animation_start_delay'),
				description: translate(
					'animated_java.animation_config.animation_start_delay.description'
				).split('\n'),
				defaultValue: 0,
				min: 0,
				step: 0.05,
			}),
		}
	}

	const settingStructure: GUIStructure = [
		{
			type: 'setting',
			id: 'animated_java:animation_name',
		},
		{
			type: 'setting',
			id: 'animated_java:animation_loop',
		},
		{
			type: 'setting',
			id: 'animated_java:animation_loop_delay',
		},
		{
			type: 'setting',
			id: 'animated_java:animation_start_delay',
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

	// @ts-ignore
	ANIMATED_JAVA.test = settings

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
