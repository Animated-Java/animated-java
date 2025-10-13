<script lang="ts" context="module">
	import { ITEM_DISPLAY_ITEM_DISPLAY_SELECT } from '../interface/panel/vanillaItemDisplayElement'
	import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
	import EVENTS from '../util/events'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	let selectedDisplay = VanillaItemDisplay.selected.at(0)
	let lastSelected = selectedDisplay

	let item = new Valuable<string>('')
	let error = new Valuable<string>('')
	let itemDisplaySlot: HTMLDivElement
	let visible = false

	let unsub: (() => void) | undefined

	EVENTS.UPDATE_SELECTION.subscribe(() => {
		selectedDisplay = VanillaItemDisplay.selected.at(0)
		if (!selectedDisplay || selected.length > 1) {
			item = new Valuable('')
			error = new Valuable('')
			visible = false
			return
		}
		$item = selectedDisplay.item
		error = selectedDisplay.error
		visible = true
	})

	EVENTS.UPDATE_SELECTION.subscribe(() => {
		unsub?.()

		lastSelected = selectedDisplay
		selectedDisplay = VanillaItemDisplay.selected.at(0)

		if (!selectedDisplay) {
			visible = false
			return
		}

		$item = selectedDisplay.item
		error = selectedDisplay.error
		ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set(selectedDisplay.itemDisplay)
		visible = true

		unsub = item.subscribe(value => {
			if (selectedDisplay == undefined || selectedDisplay !== lastSelected) {
				lastSelected = selectedDisplay
				return
			}
			if (value === selectedDisplay.item) return

			Undo.initEdit({ elements: VanillaItemDisplay.selected })

			if (VanillaItemDisplay.selected.length > 1) {
				for (const display of VanillaItemDisplay.selected) {
					display.item = value
				}
			} else {
				selectedDisplay.item = value
			}
			Project!.saved = false

			Undo.finishEdit(`Change Item Display's Item to "${$item}"`, {
				elements: VanillaItemDisplay.selected,
			})
		})
	})

	requestAnimationFrame(() => {
		itemDisplaySlot.appendChild(ITEM_DISPLAY_ITEM_DISPLAY_SELECT.node)
	})
</script>

<p class="panel_toolbar_label label" style={!!visible ? '' : 'visibility:hidden; height: 0px;'}>
	{translate('panel.vanilla_item_display.title')}
</p>

<div
	class="toolbar custom-toolbar"
	style={!!visible ? '' : 'visibility:hidden; height: 0px;'}
	title={translate('panel.vanilla_item_display.description')}
>
	<div class="content" style="width: 95%;">
		<input type="text" bind:value={$item} />
	</div>
	<div class="content" bind:this={itemDisplaySlot}></div>
</div>

<div
	class="error"
	style={!!$error ? '' : 'visibility:hidden; height: 0px; color: var(--color-error);'}
>
	{$error}
</div>

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
