<script lang="ts">
	import { projectSettingStructure } from '../../projectSettings'
	import * as AJ from '../../settings'
	import AJUINode from './uiNode.svelte'
	import Setting from './setting.svelte'
	import FancyHeader from './fancyHeader.svelte'
	import { onDestroy } from 'svelte'
	import { fade, fly, blur, scale, slide } from 'svelte/transition'
	import { defer } from '../../util'
	import { _AnimatedJavaExporter } from '../../exporter'

	let settingArray = Object.values(Project!.animated_java_settings!) as AJ.Setting<any>[]
	console.log('Project Settings', settings, projectSettingStructure)

	let selectedExporter: _AnimatedJavaExporter | undefined

	function getSelectedExporter() {
		selectedExporter = Object.entries(AnimatedJavaExporter.exporters).find(([, exporter]) => {
			return exporter.id === Project!.animated_java_settings!.exporter.selected?.value
		})?.[1]
		console.log('Selected Exporter', selectedExporter)
	}

	queueMicrotask(() => {
		getSelectedExporter()
	})

	let unsub = Project!.animated_java_settings!.exporter.subscribe(() => {
		selectedExporter = undefined
	})
	onDestroy(() => {
		unsub()
	})
</script>

<div class="dialog-content">
	{#each projectSettingStructure as el}
		<AJUINode {el} {settingArray} />
	{/each}

	{#if selectedExporter}
		{#key selectedExporter}
			<div transition:slide={{ duration: 250 }} on:outroend={getSelectedExporter}>
				<FancyHeader content={selectedExporter.name + ' Settings'} />
				{#each selectedExporter.settingsStructure as el}
					<AJUINode {el} settingArray={Object.values(selectedExporter.settings)} />
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
</style>
