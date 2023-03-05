<script lang="ts">
	import { Variant } from '../../variants'
	import * as AJ from '../../settings'
	import { translate } from '../../util/translation'
	import type { GUIStructure } from '../ajUIStructure'
	import { safeFunctionName } from '../../minecraft/util'
	import UiNode from './uiNode.svelte'
	import { onDestroy } from 'svelte'
	import * as events from '../../util/events'
	import TextureMap from './variants/textureMapSetting.svelte'

	const TRANSLATIONS = {
		name: {
			displayName: translate('animated_java.dialog.variant_properties.variant_name'),
			description: translate(
				'animated_java.dialog.variant_properties.variant_name.description'
			).split('\n'),
			error: {
				duplicate_name: translate(
					'animated_java.dialog.variant_properties.variant_name.error.duplicate_name'
				),
			},
		},
	}

	export let variant: Variant
	let settings: Record<string, AJ.Setting<any>> = {}

	function getDefaultSettings(): Record<string, AJ.Setting<any>> {
		return {
			name: new AJ.InlineTextSetting(
				{
					id: 'animated_java:variant_properties/name',
					displayName: TRANSLATIONS.name.displayName,
					description: TRANSLATIONS.name.description,
					defaultValue: variant.name,
					docsLink: 'page:rig/variants#variant_name',
				},
				function onUpdate(setting) {
					setting.value = safeFunctionName(setting.value)

					if (
						Project!.animated_java_variants!.variants.find(
							v => v.name === setting.value && v !== variant
						)
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
		}
	}

	const settingStructure: GUIStructure = [
		{
			type: 'setting',
			id: 'animated_java:variant_properties/name',
		},
	]

	function loadVariant() {
		settings = getDefaultSettings()
		if (!Project?.animated_java_variants) return
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
		events.VARIANT_PROPERTIES_UPDATE.dispatch()
	})
</script>

<div class="container">
	{#each settingStructure as el}
		<UiNode {el} settingArray={Object.values(settings)} />
	{/each}
	{#if !variant.default}
		<TextureMap {variant} />
	{/if}
</div>

<style>
	div.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: stretch;
	}
</style>
