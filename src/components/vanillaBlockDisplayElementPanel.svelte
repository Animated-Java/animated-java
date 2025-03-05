<script lang="ts">
	import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
	import { events } from '../util/events'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'

	let selectedDisplay = VanillaBlockDisplay.selected.at(0)
	let lastSelected = selectedDisplay

	let block = new Valuable<string>('')
	let error = new Valuable<string>('')
	let visible = false

	let unsub: (() => void) | undefined

	events.UPDATE_SELECTION.subscribe(() => {
		unsub?.()

		lastSelected = selectedDisplay
		selectedDisplay = VanillaBlockDisplay.selected.at(0)

		if (!selectedDisplay) {
			visible = false
			return
		}

		$block = selectedDisplay.block
		error = selectedDisplay.error
		visible = true

		unsub = block.subscribe(value => {
			if (selectedDisplay == undefined || selectedDisplay !== lastSelected) {
				lastSelected = selectedDisplay
				return
			}
			if (value === selectedDisplay.block) return

			Undo.initEdit({ elements: VanillaBlockDisplay.selected })

			if (VanillaBlockDisplay.selected.length > 1) {
				for (const display of VanillaBlockDisplay.selected) {
					display.block = value
				}
			} else {
				selectedDisplay.block = value
			}
			Project!.saved = false

			Undo.finishEdit(`Change Block Display Block to "${$block}"`, {
				elements: VanillaBlockDisplay.selected,
			})
		})
	})
</script>

<p class="panel_toolbar_label label" style={!!visible ? '' : 'visibility:hidden; height: 0px;'}>
	{translate('panel.vanilla_block_display.title')}
</p>

<div
	class="toolbar custom-toolbar"
	style={!!visible ? '' : 'visibility:hidden; height: 0px;'}
	title={translate('panel.vanilla_block_display.description')}
>
	<div class="content" style="width: 95%;">
		<input type="text" bind:value={$block} />
	</div>
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
</style>
