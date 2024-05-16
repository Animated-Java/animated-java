<script lang="ts" context="module">
	import { TextDisplay } from '../../outliner/textDisplay'
	import { JsonText } from '../../systems/minecraft/jsonText'
	import { debounce } from '../../systems/util'
	import { events } from '../../util/events'
	import { Valuable } from '../../util/stores'
</script>

<script lang="ts">
	let text: Valuable<string> = new Valuable('')
	let textDisplaySelected = false
	let unsub: (() => void) | undefined

	events.UPDATE_SELECTION.subscribe(() => {
		textDisplaySelected = !!TextDisplay.selected.length
		if (textDisplaySelected) {
			if (unsub) unsub()
			text.set(TextDisplay.selected[0].text)
			unsub = text.subscribe(value => {
				const selected = TextDisplay.selected[0]
				if (TextDisplay.selected[0].text === value) return
				selected.text = value
				let text: JsonText | undefined
				try {
					text = JsonText.fromString(selected.text)
				} catch (e) {
					console.error(e)
				}
				if (text) selected.setText(text)
			})
		}
	})
</script>

<p class="panel_toolbar_label label" style={textDisplaySelected ? '' : 'visibility:hidden'}>
	Text Display
</p>
<div class="toolbar" style={textDisplaySelected ? '' : 'visibility:hidden'}>
	<div class="content">
		<textarea class="tab_target" bind:value={$text} />
	</div>
</div>

<style>
	.label {
		margin-bottom: -3px !important;
	}
	textarea {
		background-color: var(--color-button);
		font-family: var(--font-code);
		font-size: 14px;
		text-align: left;
		padding: 4px 8px;
		height: 4rem;
		resize: vertical;
		border: none;
	}
</style>
