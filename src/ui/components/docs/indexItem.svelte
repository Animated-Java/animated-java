<script lang="ts">
	import { children } from 'svelte/internal'

	export let index: any

	function handleClick(event: any) {
		event.preventDefault()
		console.log('click')
	}
</script>

<div>
	<div class="flex-row">
		{#if Object.keys(index.children).length}
			<span class="material-icons" style="margin:0px">expand_more</span>
		{/if}
		<p class="name" on:click={handleClick}>{index.name}</p>
	</div>
	{#if index.children}
		<div class="child">
			{#each Object.values(index.children) as localIndex}
				<svelte:self index={localIndex} />
			{/each}
		</div>
	{/if}
</div>

<style>
	p.name {
		overflow: hidden;
		word-wrap: none;
	}

	/* div.flex-column {
		display: flex;
		align-items: center;
		flex-direction: column;
		align-items: flex-start;
	} */

	div.flex-row {
		display: flex;
		align-items: center;
		flex-direction: row;
	}

	div.child {
		margin-left: 20px;
	}
</style>
