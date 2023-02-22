<script lang="ts">
	export let value: number
	export let options: any[]
</script>

<select bind:value>
	{#each options as option, index}
		<option value={index}>
			<p>{option.displayName}</p>
		</option>
	{/each}
</select>
