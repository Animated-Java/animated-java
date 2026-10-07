<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		id: string
		label: string
		description: string
		/** Shows the label and description instead of just the control. */
		detailed: boolean
		/** Shows the label next to the control when not detailed. */
		inlineLabel?: boolean
		children: Snippet
	}

	let { id, label, description, detailed, inlineLabel = false, children }: Props = $props()
</script>

{#if detailed}
	<div class="tint-field">
		<label for={id}>{label}</label>
		<div class="control">
			{@render children()}
			<p class="description">{description}</p>
		</div>
	</div>
{:else}
	{#if inlineLabel}
		<label class="inline-label" for={id}>{label}</label>
	{/if}
	{@render children()}
{/if}

<style>
	.tint-field {
		display: grid;
		grid-template-columns: 150px minmax(0, 1fr);
		column-gap: 16px;
		align-items: start;
	}

	.tint-field label {
		padding-top: 4px;
	}

	.control {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.description {
		margin: 4px 0 0;
		font-size: 0.9em;
		line-height: 1.35;
		color: var(--color-subtle_text);
	}

	.inline-label {
		flex-shrink: 0;
		font-size: 0.9em;
		color: var(--color-subtle_text);
	}
</style>
