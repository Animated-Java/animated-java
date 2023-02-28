<script lang="ts">
	import type { DropdownSetting } from '../../../settings'
	export let value: number
	export let options: DropdownSetting['options']
</script>

<select bind:value>
	{#each options as option, index}
		<option value={index}>
			<div>{option.name}</div>
		</option>
	{/each}
</select>

<style>
</style>
