<script lang="ts" context="module">
	import { translate } from '../../util/translation'
	import * as AJ from '../../settings'
	import type { GUIStructure } from '../../guiStructure'
	import UiNode from './settingNode.svelte'
	import { onDestroy } from 'svelte'
	import { NbtTag } from 'deepslate'

	const TRANSLATIONS = {
		nbt: {
			displayName: translate('animated_java.bone_config.nbt'),
			description: translate('animated_java.bone_config.nbt.description').split('\n'),
		},
	}
</script>

<script lang="ts">
	export let group: Group
	const settings: Record<string, AJ.Setting<any>> = {
		nbt: new AJ.CodeboxSetting(
			{
				id: 'animated_java:bone_config/name',
				displayName: TRANSLATIONS.nbt.displayName,
				description: TRANSLATIONS.nbt.description,
				language: 'json',
				defaultValue: '{}',
			},
			function onUpdate(setting) {
				try {
					NbtTag.fromString(setting.value)
				} catch (e: any) {
					setting.infoPopup = AJ.createInfo('error', e.message)
				}
			}
		),
	}
	const settingStructure: GUIStructure = [
		{
			type: 'setting',
			settingId: 'animated_java:bone_config/name',
		},
	]

	// Load the bone into the settings
	for (const [id, setting] of Object.entries(settings)) {
		switch (id) {
			default:
				// @ts-ignore
				setting.value = group[id]
				break
		}
	}

	const unsubs = Object.entries(settings).map(([key, s]) => {
		return s.subscribe(() => {
			switch (key) {
				default:
					// @ts-ignore
					group[key] = s.value
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
