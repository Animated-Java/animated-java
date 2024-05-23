<script lang="ts" context="module">
	import { TextDisplay } from '../outliner/textDisplay'
	import { events } from '../util/events'
	import { Valuable } from '../util/stores'
	import { CodeJar } from '@novacbn/svelte-codejar'
	import {
		TEXT_DISPLAY_WIDTH_SLIDER,
		TEXT_DISPLAY_BACKGROUND_COLOR_PICKER,
	} from '../interface/textDisplayElementPanel'

	function highlight(code: string, syntax?: string) {
		if (!syntax) return code
		return Prism.highlight(code, Prism.languages[syntax], syntax)
	}
</script>

<script lang="ts">
	let selected = TextDisplay.selected.at(0)

	// @ts-expect-error
	let text = selected?._text ?? new Valuable('')
	// @ts-expect-error
	let error = selected?._textError ?? new Valuable('')
	// let backgroundColor =
	// 	// @ts-expect-error
	// 	selected?._backgroundColor ?? new Valuable('#000000')
	// let backgroundAlpha =
	// 	// @ts-expect-error
	// 	selected?._backgroundAlpha ?? new Valuable(0.25)

	let lineWidthSlot: HTMLDivElement
	let backgroundColorSlot: HTMLDivElement

	events.UPDATE_SELECTION.subscribe(() => {
		selected = TextDisplay.selected.at(0)
		if (!selected) return
		// This might be a bit hacky, but svelte seems to handle it fine.
		// @ts-ignore
		text = selected._text
		error = selected.textError
		// // @ts-expect-error
		// backgroundColor = selected._backgroundColor
		// // @ts-expect-error
		// backgroundAlpha = selected._backgroundAlpha

		// Force the inputs to update
		TEXT_DISPLAY_WIDTH_SLIDER.setValue(selected.lineWidth)
		const color = selected.backgroundColor + Number((255 * 0.25).toFixed(0)).toString(16)
		TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set(color)
	})

	requestAnimationFrame(() => {
		lineWidthSlot.appendChild(TEXT_DISPLAY_WIDTH_SLIDER.node)
		backgroundColorSlot.appendChild(TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.node)
	})
</script>

<p class="panel_toolbar_label label" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	Text Component
</p>

<div class="toolbar custom-toolbar" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	<div class="content" bind:this={lineWidthSlot}></div>
	<div class="content" bind:this={backgroundColorSlot}></div>
</div>

<div class="toolbar" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	<div class="content">
		<CodeJar
			syntax="json"
			{highlight}
			bind:value={$text}
			style="
				background-color: var(--color-button);
				font-family: var(--font-code);
				font-size: 14px;
				text-align: left;
				padding: 4px 8px;
				height: 10rem;
				resize: vertical;
				border: none;
				width: 95%;
				margin-bottom: 0px;
				outline: none;
				overflow-wrap: break-word;
				overflow-y: auto;
				white-space: pre-wrap;
				margin-top: 0px;
			"
		/>
		{#if $error}
			<textarea readonly>{$error}</textarea>
		{/if}
	</div>
</div>

<style>
	.label {
		margin-bottom: -3px !important;
	}
	textarea {
		color: var(--color-error);
		background-color: var(--color-back);
		padding: 4px 8px;
		word-wrap: unset;
		text-wrap: nowrap;
		overflow: scroll;
		height: 10rem;
		font-size: small;
		font-family: var(--font-code);
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
</style>
