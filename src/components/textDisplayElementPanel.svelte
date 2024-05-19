<script lang="ts" context="module">
	import { TextDisplay } from '../outliner/textDisplay'

	import { events } from '../util/events'
	import { Valuable } from '../util/stores'
	import { CodeJar } from '@novacbn/svelte-codejar'
	import { TEXT_DISPLAY_WIDTH_SLIDER } from '../interface/textDisplayElementPanel'

	function highlight(code: string, syntax?: string) {
		if (!syntax) return code
		return Prism.highlight(code, Prism.languages[syntax], syntax)
	}
</script>

<script lang="ts">
	let text: Valuable<string> = new Valuable('')
	let error: Valuable<string> = new Valuable('')
	let sliderSlot: HTMLDivElement
	let selected = TextDisplay.selected.at(0)

	events.UPDATE_SELECTION.subscribe(() => {
		selected = TextDisplay.selected.at(0)
		if (!selected) return
		// This might be a bit hacky, but svelte seems to handle it fine.
		// @ts-ignore
		text = selected._text
		error = selected.textError
		// Force the slider to update
		TEXT_DISPLAY_WIDTH_SLIDER.setValue(selected.lineWidth)
	})

	requestAnimationFrame(() => {
		sliderSlot.appendChild(TEXT_DISPLAY_WIDTH_SLIDER.node)
	})
</script>

<p class="panel_toolbar_label label" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	Text Component
</p>
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
				height: 4rem;
				resize: vertical;
				border: none;
				width: 95%;
				margin-bottom: 0px;
			"
		/>
		{#if $error}
			<textarea readonly>{$error}</textarea>
		{/if}
	</div>
</div>
<p class="panel_toolbar_label label" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	Line Width
</p>
<div class="toolbar" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	<div class="content" bind:this={sliderSlot}></div>
</div>

<style>
	p {
		margin: 0;
	}
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
</style>
