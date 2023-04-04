<script lang="ts">
	import { Variant } from '../../variants'
	import * as AJ from '../../settings'
	import { translate } from '../../util/translation'
	import type { GUIStructure } from '../../guiStructure'
	import { safeFunctionName } from '../../minecraft/util'
	import UiNode from './settingNode.svelte'
	import { onDestroy } from 'svelte'
	import * as events from '../../events'
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
			addNewItemMessage: translate(
				'animated_java.dialog.variant_properties.affected_bones.add_new_item_message'
			),
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
					addNewItemMessage: TRANSLATIONS.affected_bones.addNewItemMessage,
					defaultValue: [],
					options: [],
					docsLink: 'page:rig/variants#affected_bones',
				},
				function onUpdate(setting) {
					setting.value.map(v => {
						const bone = Group.all.find(g => v && g.uuid === v.value)
						if (bone) v.name = bone.name
						else v.value = '???'
					})
					setting.value = setting.value.filter(v => v.value !== '???')
					// console.log(setting.value)

					setting.options = Group.all
						.filter(g => !setting.value.find(v => v.value === g.uuid))
						.map(g => ({
							name: g.name,
							value: g.uuid,
						}))
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
					setting.value = variant.affectedBones.map(b => {
						const bone = Group.all.find(g => g.uuid === b.value)
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
					variant.affectedBones = (s as AJ.ListBuilderSetting).value
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
		justify-content: flex-start;
		align-items: stretch;
		overflow-y: auto;
		max-height: 800px;
	}
</style>
