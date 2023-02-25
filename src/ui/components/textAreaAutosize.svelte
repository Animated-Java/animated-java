<script lang="ts">
	export let value = ''
	export let maxHeight: string = 'auto'
	export let maxWidth: string = 'auto'
</script>

<div class="grow-wrap" style="max-width:{maxWidth}; overflow:scroll;">
	{#key value}
		<div
			class="grow-wrap-after grow-wrap-content"
			style="overflow:hidden; max-width:{maxWidth}; max-height:{maxHeight};"
		>
			{value}
		</div>
	{/key}
	<textarea
		class="grow-wrap-content"
		style="overflow-y:scroll; max-width:{maxWidth}; max-height:{maxHeight};"
		bind:value
	/>
</div>

<style>
	.grow-wrap {
		display: grid;
	}
	.grow-wrap-after {
		/* content: attr(data-replicated-value) ' '; */
		white-space: pre-wrap;
		visibility: hidden;
	}
	.grow-wrap > textarea {
		resize: none;
		overflow: hidden;
	}
	.grow-wrap-content {
		border: 1px solid black;
		font-family: var(--font-code);
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		grid-area: 1 / 1 / 2 / 2;
	}
</style>
