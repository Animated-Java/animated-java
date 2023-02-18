<script lang="ts">
	import * as AJSettings from '../settings'
	import type { IAnimatedJavaProjectSettings } from '../projectSettings'
	import Setting from './settingsComponents/setting.svelte'
	import Header from './settingsComponents/header.svelte'
	import { onDestroy } from 'svelte'
	import { fade, fly, blur, scale } from 'svelte/transition'
	import { defer } from '../util'

	export let settings: IAnimatedJavaProjectSettings
	console.log('Project Settings', settings)
	const settingArray = Object.values(settings)
	const exporters = AnimatedJavaExporter.exporters
	let selectedExporter: typeof settings.exporter.options[0] | undefined
	let loaded = false

	defer(() => {
		selectedExporter = settings.exporter.options[settings.exporter.value]
	})

	const unsubscribe = settings.exporter.subscribe(value => {
		selectedExporter = undefined
		setTimeout(() => {
			selectedExporter = settings.exporter.options[settings.exporter.value]
		}, 300)
	})

	onDestroy(() => {
		unsubscribe()
	})
</script>

<div>
	{#each settingArray as setting}
		{#if setting instanceof AJSettings.AJTitleSetting}
			<Header content={setting.displayName} />
		{:else}
			<Setting {setting} />
		{/if}
	{/each}
	{#if selectedExporter}
		<div transition:fade={{ duration: 300 }} style="z-index: 100">
			<Header content={selectedExporter?.displayName + ' Settings'} />
		</div>
		<div transition:scale={{ start: 0.9, duration: 300 }}>
			{#each Object.values(exporters[selectedExporter.value].settings) as setting}
				<Setting {setting} />
			{/each}
		</div>
	{/if}
</div>

<style>
</style>
