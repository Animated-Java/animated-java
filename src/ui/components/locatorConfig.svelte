<script lang="ts" context="module">
	import { translate } from '../../util/translation'
	import * as AJ from '../../settings'
	import type { GUIStructure } from '../../guiStructure'
	import UiNode from './settingNode.svelte'
	import { onDestroy } from 'svelte'
	import { NbtTag } from 'deepslate'
	import { Entities } from '../../minecraft'

	const TRANSLATIONS = {
		teleported_entity_type: {
			displayName: translate('animated_java.locator_config.teleported_entity_type'),
			description: translate(
				'animated_java.locator_config.teleported_entity_type.description'
			).split('\n'),
			error: {
				unset: translate('animated_java.locator_config.teleported_entity_type.error.unset'),
				space: translate('animated_java.locator_config.teleported_entity_type.error.space'),
				invalid_namespace: translate(
					'animated_java.locator_config.teleported_entity_type.error.invalid_namespace'
				),
			},
			warning: {
				unknown_entity: translate(
					'animated_java.locator_config.teleported_entity_type.warning.unknown_entity'
				),
			},
		},
	}
</script>

<script lang="ts">
	export let locator: Locator
	const settings: Record<string, AJ.Setting<any>> = {
		teleported_entity_type: new AJ.InlineTextSetting(
			{
				id: 'animated_java:locator_config/teleported_entity_type',
				displayName: TRANSLATIONS.teleported_entity_type.displayName,
				description: TRANSLATIONS.teleported_entity_type.description,
				defaultValue: '',
			},
			function onUpdate(setting) {
				setting.value = setting.value.toLowerCase()

				if (setting.value === '') {
					return
				} else if (setting.value.includes(' ')) {
					setting.infoPopup = AJ.createInfo(
						'error',
						TRANSLATIONS.teleported_entity_type.error.space
					)
					return
				}

				const [namespace, path] = setting.value.split(':')
				if (!(namespace && path)) {
					setting.infoPopup = AJ.createInfo(
						'error',
						TRANSLATIONS.teleported_entity_type.error.invalid_namespace
					)
					return
				}

				if (!Entities.isEntity(setting.value)) {
					setting.infoPopup = AJ.createInfo(
						'warning',
						TRANSLATIONS.teleported_entity_type.warning.unknown_entity
					)
					return
				}

				return
			}
		),
	}
	const settingStructure: GUIStructure = [
		{
			type: 'setting',
			settingId: settings.teleported_entity_type.id,
		},
	]

	// Load the bone into the settings
	for (const [id, setting] of Object.entries(settings)) {
		switch (id) {
			default:
				// @ts-ignore
				setting.value = locator[id] === undefined ? setting.defaultValue : locator[id]
				break
		}
	}

	const unsubs = Object.entries(settings).map(([key, s]) => {
		return s.subscribe(() => {
			switch (key) {
				default:
					// @ts-ignore
					locator[key] = s.value
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
