<script lang="ts">
	import { onDestroy } from 'svelte'
	import { Variant } from '../../variants'

	let selected: _Keyframe[] = Blockbench.Keyframe.selected
	let value: any

	$: variants = getVariants()

	function getVariants() {
		return Project?.animated_java_variants?.variants || []
	}

	function update() {
		selected = Blockbench.Keyframe.selected
		value = Blockbench.Keyframe.selected[0]?.data_points[0].variant
		requestAnimationFrame(update)
	}

	update()
</script>

{#if selected.length === 1}
	<div class="container">
		{#if selected[0].channel === 'variants'}
			<p class="name">Variant</p>
			{#key variants}
				<select {value} style="margin-left: 1em;">
					{#each variants as variant, index}
						<option value={index}>
							<div>{variant.name}</div>
						</option>
					{/each}
				</select>
			{/key}
		{:else if selected[0].channel === 'functions'}
			<p class="name">Function</p>
			<input type="text" class="text-display" bind:value />
		{:else if selected[0].channel === 'states'}
			<p class="name">State</p>
			<input type="text" class="text-display" bind:value />
		{/if}
	</div>
{/if}

<style>
	div.container {
		display: flex;
		flex-direction: row;
		/* background-color: var(--color-back); */
		align-items: center;
		overflow-y: auto;
	}

	/* div.item {
		display: flex;
		flex-grow: 1;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		background-color: var(--color-back);
		font-family: var(--font-code);
		padding: 3px 8px;
		border: 1px solid var(--color-border);
	} */

	p.name {
		padding: 3px 8px;
		margin: unset;
		background-color: var(--color-button);
	}

	.text-display {
		flex-grow: 1;
	}

	/* button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;
	}

	button:hover {
		color: var(--color-light) !important;
	} */

	/* .text_inline {
		background: var(--color-dark);
		font-family: var(--font-code);
		flex-grow: 1;
		padding: 5px;
		padding-left: 11px;
		padding-right: 11px;
	} */
</style>
