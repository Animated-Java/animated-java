<script lang="ts" context="module">
	import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
	import { events } from '../util/events'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	let selectedDisplay = VanillaItemDisplay.selected.at(0)

	let item = new Valuable<string>('')
	let error = new Valuable<string>('')
	let visible = false

	events.UPDATE_SELECTION.subscribe(() => {
		selectedDisplay = VanillaItemDisplay.selected.at(0)
		if (!selectedDisplay || selected.length > 1) {
			item = new Valuable('')
			error = new Valuable('')
			visible = false
			return
		}
		item = selectedDisplay._item
		error = selectedDisplay.error
		visible = true
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
