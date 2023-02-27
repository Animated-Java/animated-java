<script lang="ts">
	import { Variant } from '../../variants'
	import * as AJ from '../../settings'
	import { translate, translateInfo } from '../../util/translation'
	import type { GUIStructure } from '../ajUIStructure'
	import { safeFunctionName } from '../../minecraft/util'
	import UiNode from './uiNode.svelte'
	import { onDestroy } from 'svelte'
	import { events } from '../../util/events'

	export let variant: Variant

	let settings: Record<string, AJ.Setting<any>> = {}

	function getDefaultSettings(): Record<string, AJ.Setting<any>> {
		return {
			name: new AJ.InlineTextSetting(
				{
					id: 'animated_java:variant_name',
					displayName: translate('animated_java.dialog.variant_properties.variant_name'),
					description: translate(
						'animated_java.dialog.variant_properties.variant_name.description'
					).split('\n'),
					defaultValue: variant.name,
					docsLink: 'page:rig/variants#variant_name',
				},
				function onUpdate(setting) {
					setting.value = safeFunctionName(setting.value)

					if (
						Project!.animated_java_variants!.variants.find(
							v => v.name === setting.value && v !== variant
						)
					)
						setting.infoPopup = translateInfo(
							'error',
							'animated_java.variant_properties.variant_name.error.duplicate_name',
							{ name: setting.value }
						)
					return setting
				}
			),
		}
	}

	const settingStructure: GUIStructure = [
		{
			type: 'setting',
			id: 'animated_java:variant_name',
		},
	]

	function loadVariant() {
		settings = getDefaultSettings()
		if (!(Project && Project.animated_java_variants)) return
		variant.createUniqueName(Project.animated_java_variants.variants)

		for (const [id, setting] of Object.entries(settings)) {
			switch (id) {
				default:
					// @ts-ignore
					setting.value = variant[id]
					break
			}
		}
	}

	loadVariant()

	const unsubs = Object.entries(settings).map(([key, s]) => {
		return s.subscribe(() => {
			switch (key) {
				case 'name':
					console.log('name', s.value)
					variant[key] = s.value
					break
				default:
					// @ts-ignore
					variant[key] = s.value
					break
			}
		})
	})

	onDestroy(() => {
		unsubs.forEach((u: any) => u())
		events.variantPropertiesUpdate.dispatch()
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
