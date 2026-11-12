<script lang="ts">
	import { translate } from '../host'
	import { COLORWAY_PREVIEW, PAINT_CONTEXT } from '../paintState'
	import PermutationEditor from './permutationEditor.svelte'

	// The set's name and colorway select are the panel's form, built in `permutationPanel.ts`.
	const context = $derived($PAINT_CONTEXT)
	const shown = $derived(context && ($COLORWAY_PREVIEW[context.set.uuid] ?? context.permutation))
</script>

{#if context}
	<div class="permutation-panel">
		{#key context.set}
			<PermutationEditor {context} {shown} />
		{/key}
	</div>
{:else}
	<div class="empty">{translate('permutation_panel.empty')}</div>
{/if}

<style>
	.permutation-panel {
		padding: 0 8px 8px;
	}
	.empty {
		padding: 8px 12px;
		color: var(--color-subtle_text);
		font-style: italic;
	}
</style>
