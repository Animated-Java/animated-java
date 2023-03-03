<script lang="ts">
	import { onDestroy } from 'svelte'
	import { slide } from 'svelte/transition'
	import { AnimatedJavaExporter } from '../../exporter'
	import { projectSettingStructure } from '../../projectSettings'
	import * as AJ from '../../settings'
	import { translate } from '../../util/translation'
	import FancyHeader from './fancyHeader.svelte'
	import AJUINode from './uiNode.svelte'

	let settingArray = Object.values(Project!.animated_java_settings!) as AJ.Setting<any>[]
	console.log('Project Settings', settings, projectSettingStructure)

	let selectedExporter: AnimatedJavaExporter | undefined

	function getSelectedExporter() {
		selectedExporter = [...AnimatedJavaExporter.exporters.values()].find(exporter => {
			return exporter.id === Project!.animated_java_settings!.exporter.selected?.value
		})
		console.log('Selected exporter changed to', selectedExporter)
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

	function getSettingArray(exporter: AnimatedJavaExporter): any {
		return Project!.animated_java_exporter_settings![exporter.id]
	}
</script>

<div class="dialog-content">
	{#each projectSettingStructure as el}
		<AJUINode {el} {settingArray} />
	{/each}

	{#if selectedExporter}
		{#key selectedExporter}
			<div transition:slide={{ duration: 250 }} on:outroend={getSelectedExporter}>
				<FancyHeader
					content={translate('animated_java.project_settings.exporter_settings', {
						exporter: selectedExporter.name,
					})}
				/>
				{#each selectedExporter.settingsStructure as el}
					<AJUINode {el} settingArray={getSettingArray(selectedExporter)} />
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
