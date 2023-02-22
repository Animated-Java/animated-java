<script lang="ts">
	import type { IAnimatedJavaProjectSettings } from '../projectSettings'
	import Setting from './settingsComponents/setting.svelte'
	import Header from './settingsComponents/header.svelte'
	import { onDestroy } from 'svelte'
	import { fade, fly, blur, scale, slide } from 'svelte/transition'
	import { defer } from '../util'

	export let settings: IAnimatedJavaProjectSettings
	console.log('Project Settings', settings)
	const settingArray = Object.values(settings)
	const exporters = AnimatedJavaExporter.exporters
	let selectedExporter: typeof settings.exporter.options[0] | undefined

	const unsub = settings.exporter.subscribe(settingData => {
		selectedExporter = undefined
	})

	function onExporterChange() {
		selectedExporter = settings.exporter.options[settings.exporter.value]
	}

	defer(() => {
		onExporterChange()
	})

	onDestroy(() => {
		unsub()
	})
</script>

<div class="dialog-content">
	{#each settingArray as setting}
		<Setting {setting} />
	{/each}
	{#if selectedExporter}
		{#key selectedExporter}
			<div transition:fade={{ duration: 250 }} on:outroend={onExporterChange}>
				<div>
					<Header content={selectedExporter.displayName + ' Settings'} />
				</div>
				{#each Object.values(exporters[selectedExporter.value].settings) as setting, index}
					<div class="setting-container">
						<Setting {setting} />
					</div>
				{/each}
			</div>
		{/key}
	{/if}
</div>

<style>
	div.dialog-content {
		overflow-y: scroll;
		max-height: 700px;
		padding-right: 10px;
	}
	div.setting-container {
		overflow: hidden;
	}
</style>
