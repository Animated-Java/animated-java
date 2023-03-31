<script lang="ts">
	import { onDestroy } from 'svelte'
	import * as AJ from '../../settings'
	import AJUINode from './settingNode.svelte'

	let settingArray = Object.values(AJ.animatedJavaSettings)

	AJ.loadAJSettings()

	onDestroy(() => {
		AJ.saveAJSettings()
	})
</script>

<div class="dialog-content">
	{#each AJ.animatedJavaSettingsStructure as el}
		<AJUINode {el} {settingArray} />
	{/each}
</div>

<style>
	div.dialog-content {
		overflow-y: scroll;
		max-height: 700px;
		padding-right: 10px;
	}
</style>
