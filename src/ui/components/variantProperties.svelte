<script lang="ts">
	import { Variant } from '../../variants'
	import * as AJ from '../../settings'
	import { translate } from '../../util/translation'
	import type { GUIStructure } from '../../guiStructure'
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
		affected_bones_is_a_whitelist: {
			displayName: translate(
				'animated_java.dialog.variant_properties.affected_bones_is_a_whitelist'
			),
			description: translate(
				'animated_java.dialog.variant_properties.affected_bones_is_a_whitelist.description'
			).split('\n'),
		},
		affected_bones: {
			displayName: translate('animated_java.dialog.variant_properties.affected_bones'),
			description: translate(
				'animated_java.dialog.variant_properties.affected_bones.description'
			).split('\n'),
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
			affected_bones_is_a_whitelist: new AJ.CheckboxSetting({
				id: 'animated_java:variant_properties/affected_bones_is_a_whitelist',
				displayName: TRANSLATIONS.affected_bones_is_a_whitelist.displayName,
				description: TRANSLATIONS.affected_bones_is_a_whitelist.description,
				defaultValue: false,
				docsLink: 'page:rig/variants#affected_bones_is_a_whitelist',
			}),
			affected_bones: new AJ.ListBuilderSetting(
				{
					id: 'animated_java:variant_properties/affected_bones',
					displayName: TRANSLATIONS.affected_bones.displayName,
					description: TRANSLATIONS.affected_bones.description,
					defaultValue: [],
					options: [],
					docsLink: 'page:rig/variants#affected_bones',
				},
				function onUpdate(setting) {
					setting.options = Group.all.map(g => ({
						name: g.name,
						value: g.uuid,
					}))
					console.log(setting.value)
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
			settingId: 'animated_java:variant_properties/name',
		},
	]

	if (!variant.default) {
		settingStructure.push(
			{
				type: 'setting',
				settingId: 'animated_java:variant_properties/affected_bones_is_a_whitelist',
			},
			{
				type: 'setting',
				settingId: 'animated_java:variant_properties/affected_bones',
			}
		)
	}

	function loadVariant() {
		settings = getDefaultSettings()
		Object.values(settings).forEach(s => s._onInit())
		if (!Project?.animated_java_variants) return
		variant.createUniqueName(Project.animated_java_variants.variants)

		for (const [key, setting] of Object.entries(settings)) {
			switch (key) {
				case 'affected_bones':
					setting.value = variant.affectedBones.map(uuid => {
						const bone = Group.all.find(g => g.uuid === uuid)
						if (!bone) return
						return {
							name: bone.name,
							value: bone.uuid,
						}
					})
					break
				case 'affected_bones_is_a_whitelist':
					setting.value = variant.affectedBonesIsAWhitelist
					break
				default:
					// @ts-ignore
					setting.value = variant[key]
					break
			}
		}
	}

	loadVariant()

	const unsubs = Object.entries(settings).map(([key, s]) => {
		return s.subscribe(() => {
			switch (key) {
				case 'name':
					variant[key] = s.value
					break
				case 'affected_bones':
					variant.affectedBones = (s as AJ.ListBuilderSetting).value.map(g => g.value)
					break
				case 'affected_bones_is_a_whitelist':
					variant.affectedBonesIsAWhitelist = s.value
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
