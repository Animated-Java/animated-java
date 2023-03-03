<script lang="ts">
	import * as AJ from '../../settings'
	import AJUINode from './uiNode.svelte'

	let settingArray = Object.values(AJ.animatedJavaSettings)
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
