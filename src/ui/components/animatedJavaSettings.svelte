<script lang="ts">
	import * as AJ from '../../settings'
	import AJUINode from './uiNode.svelte'

	let settingArray = Object.values(AJ.AnimatedJavaSettings)
</script>

<div>
	{#each AJ.AnimatedJavaSettingsStructure as el}
		<AJUINode {el} {settingArray} />
	{/each}
</div>

<style>
</style>
