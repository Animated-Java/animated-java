<script lang="ts" context="module">
	import { validateItem } from 'src/util/minecraftUtil'
	import { ITEM_DISPLAY_ITEM_DISPLAY_SELECT } from '../interface/panel/vanillaItemDisplayElement'
	import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	export let selected: VanillaItemDisplay

	let item = selected.item
	let error = selected.error

	ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set(selected.itemDisplay)

	$: {
		$error = ''
		if (selected.item !== item) {
			void validateItem(item)
				.then(err => {
					if (err) {
						$error = err
						console.log('Item validation error:', err)
						return
					}
					console.log('Changing item to', item)
					Undo.initEdit({ elements: [selected] })

					selected.item = item
					Project!.saved = false

					Undo.finishEdit(`Change Item Display Item to "${item}"`, {
						elements: [selected],
					})
				})
				.catch(err => {
					$error = err.message
				})
		}
	}

	const mountItemDisplaySelect = (node: HTMLDivElement) => {
		node.appendChild(ITEM_DISPLAY_ITEM_DISPLAY_SELECT.node)
	}
</script>

<p class="panel_toolbar_label label">
	{translate('panel.vanilla_item_display.title')}
</p>

<div class="toolbar custom-toolbar" title={translate('panel.vanilla_item_display.description')}>
	<div class="content" style="width: 95%;">
		<input type="text" bind:value={item} />
	</div>
	<div class="content" use:mountItemDisplaySelect></div>
</div>

{#if $error}
	<div class="error">
		{$error}
	</div>
{/if}

<style>
	input {
		background-color: var(--color-button);
		padding: 2px 8px;
		width: 100%;
	}
	.label {
		margin-bottom: -3px !important;
	}
	.custom-toolbar {
		display: flex;
		flex-direction: row;
		margin-bottom: 1px;
	}
	.custom-toolbar :global(.sp-replacer) {
		padding: 4px 18px !important;
		height: 28px !important;
		margin: 1px 0px !important;
	}
	.error {
		margin: 2px 8px;
		font-size: 14px;
		color: var(--color-error);
	}
	.custom-toolbar :global([toolbar_item='animated_java:itemDisplayAlignmentSelect']) {
		margin: 0px 2px !important;
	}
</style>
