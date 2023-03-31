<script lang="ts">
	import { onDestroy } from 'svelte'
	import { fly } from '../util/accessability'
	import { AnimatedJavaExporter } from '../../exporter'
	import { projectSettingStructure } from '../../projectSettings'
	import * as AJ from '../../settings'
	import { translate } from '../../util/translation'
	import FancyHeader from './fancyHeader.svelte'
	import AJUINode from './settingNode.svelte'

	let settingArray = Object.values(Project!.animated_java_settings!) as AJ.Setting<any>[]
	console.log('Project Settings', settings, projectSettingStructure)

	let selectedExporter: AnimatedJavaExporter | undefined

	function updateSelectedExporter() {
		selectedExporter = AnimatedJavaExporter.all.find(exporter => {
			return exporter.id === Project!.animated_java_settings!.exporter.selected?.value
		})
	}

	updateSelectedExporter()

	let unsub: () => void
	requestAnimationFrame(() => {
		unsub = Project!.animated_java_settings!.exporter.subscribe(() => {
			updateSelectedExporter()
			// console.log('Selected exporter changed to', selectedExporter)
		})
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
			<div in:$fly|local={{ x: -20, duration: 250 }}>
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
