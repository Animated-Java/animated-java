<script lang="ts">
	import { projectSettingStructure } from '../projectSettings'
	import * as AJ from '../settings'
	import AJUINode from './settingsComponents/uiNode.svelte'
	import Setting from './settingsComponents/setting.svelte'
	import FancyHeader from './settingsComponents/fancyHeader.svelte'
	import { onDestroy } from 'svelte'
	import { fade, fly, blur, scale, slide } from 'svelte/transition'
	import { defer } from '../util'

	let settingArray = Object.values(Project!.animated_java_settings!) as AJ.Setting<any>[]
	console.log('Project Settings', settings, projectSettingStructure)
	// const exporters = AnimatedJavaExporter.exporters
	// let selectedExporter: typeof settings.exporter.options[0] | undefined

	// const unsub = settings.exporter.subscribe(settingData => {
	// 	selectedExporter = undefined
	// })

	// function onExporterChange() {
	// 	selectedExporter = settings.exporter.options[settings.exporter.value]
	// }

	// defer(() => {
	// 	onExporterChange()
	// })

	// onDestroy(() => {
	// 	unsub()
	// })
</script>

<div class="dialog-content">
	{#each projectSettingStructure as el}
		<AJUINode {el} {settingArray} />
	{/each}
</div>

<!-- {#if selectedExporter}
	{#key selectedExporter}
		<div transition:fade={{ duration: 250 }} on:outroend={onExporterChange}>
			<div>
				<Header content={selectedExporter.displayName + ' Settings'} />
			</div>
			{#each Object.values(exporters[selectedExporter.value].settings) as setting, index}
				<Setting {setting} />
			{/each}
		</div>
	{/key}
{/if} -->
<style>
	div.dialog-content {
		overflow-y: scroll;
		max-height: 700px;
		padding-right: 10px;
	}
</style>
