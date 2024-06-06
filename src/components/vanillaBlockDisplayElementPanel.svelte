<script lang="ts" context="module">
	import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
	import { events } from '../util/events'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'
</script>

<script lang="ts">
	let selected = VanillaBlockDisplay.selected.at(0)

	let block = new Valuable<string>('')
	let error = new Valuable<string>('')

	events.UPDATE_SELECTION.subscribe(() => {
		selected = VanillaBlockDisplay.selected.at(0)
		if (!selected) {
			block = new Valuable('')
			error = new Valuable('')
			return
		}
		block = selected._block
		error = selected.error
	})
</script>

<p class="panel_toolbar_label label" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	{translate('panel.vanilla_block_display.title')}
</p>

<div class="toolbar custom-toolbar" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
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
