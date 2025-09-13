<script lang="ts">
	import type { Snippet } from 'svelte'

	/**
	 * @param id The unique ID generated for this item
	 */
	type ChildProps = [string]

	interface Props {
		label: string
		description?: string
		required?: boolean
		/** Snippet to be placed inline with the label*/
		inline?: Snippet<ChildProps>
		/** Snippet to be placed below the label and description */
		below?: Snippet<ChildProps>
	}

	const { label, description, required, inline, below }: Props = $props()
	const ID = guid()
</script>

<div class="container">
	<div class="label-container">
		<label for={ID}>
			{label}
			{#if required}
				<span>*</span>
			{/if}
		</label>
		{#if inline}
			{@render inline(ID)}
		{/if}
	</div>
	{#if description}
		<p class="description">
			{@html description}
		</p>
	{/if}
	{#if below}
		<div class="below">
			{@render below(ID)}
		</div>
	{/if}
	{#if !inline && !below}
		<div>Dialog Item has no content!</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}
	.label-container {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	label {
		font-size: larger;
	}
	.description {
		color: var(--color-subtle_text);
		margin-left: 4px;
	}
	span {
		color: var(--color-accent);
	}
</style>
