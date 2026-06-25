<script lang="ts" module>
	import { onDestroy } from 'svelte'
	import { VanillaItemDisplay } from '../../outliner/vanillaItemDisplay'
	import EVENTS from '../../util/events'
	import { localize as translate } from '../../util/lang'
	import {
		ITEM_DISPLAY_ITEM_DISPLAY_SELECT,
		updateItemDisplaySelect,
	} from './vanillaItemDisplayElement'
</script>

<script lang="ts">
	import { validateItem } from '../../util/minecraftUtil'

	let selected = $state(VanillaItemDisplay.selected.at(0))
	let item = $derived(selected?.item)
	let error = $derived(selected?.error)

	const onSelectionChanged = () => {
		selected = VanillaItemDisplay.selected.at(0)
		item = selected?.item
		error = selected?.error
		updateItemDisplaySelect()
	}

	const unsubs = [
		EVENTS.UNDO.subscribe(onSelectionChanged),
		EVENTS.REDO.subscribe(onSelectionChanged),
		EVENTS.UPDATE_SELECTION.subscribe(onSelectionChanged),
	]

	$effect(() => {
		const thisSelected = selected
		const thisItem = item
		error?.set('')
		if (thisSelected && thisItem && thisSelected.item !== thisItem) {
			void validateItem(thisItem)
				.then(err => {
					if (err) {
						error?.set(err)
						console.log('Item validation error:', err)
						return
					}
					console.log('Changing item to', thisItem)
					Undo.initEdit({ elements: [thisSelected] })

					thisSelected.item = thisItem
					Project!.saved = false

					Undo.finishEdit(`Change Item Display Item to "${thisItem}"`, {
						elements: [thisSelected],
					})
				})
				.catch(err => {
					error?.set(err.message)
				})
		}
	})

	const mountItemDisplaySelect = (node: HTMLDivElement) => {
		node.appendChild(ITEM_DISPLAY_ITEM_DISPLAY_SELECT.node)
	}

	onDestroy(() => {
		unsubs.forEach(u => u())
	})
</script>

{#if selected}
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
