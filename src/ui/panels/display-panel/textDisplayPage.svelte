<script lang="ts">
	import { CodeJar } from '@novacbn/svelte-codejar'
	import {
		TEXT_DISPLAY_ALIGNMENT_SELECT,
		TEXT_DISPLAY_BACKGROUND_COLOR_PICKER,
		TEXT_DISPLAY_SEE_THROUGH_TOGGLE,
		TEXT_DISPLAY_SHADOW_TOGGLE,
		TEXT_DISPLAY_WIDTH_SLIDER,
	} from '.'
	import { TextDisplay } from '../../../blockbench-additions/outliner-elements/textDisplay'
	import { floatToHex } from '../../../util/misc'
	import { translate } from '../../../util/translation'

	function highlight(code: string, syntax?: string) {
		if (!syntax) return code
		return Prism.highlight(code, Prism.languages[syntax], syntax)
	}

	export let textDisplay: TextDisplay

	// @ts-expect-error
	const TEXT = textDisplay.__text
	const ERROR = textDisplay.textError

	let lineWidthSlot: HTMLDivElement
	let backgroundColorSlot: HTMLDivElement
	let shadowSlot: HTMLDivElement
	let alignmentSlot: HTMLDivElement
	let seeThroughSlot: HTMLDivElement
	let codeJar: CodeJar

	// Force the inputs to update
	TEXT_DISPLAY_WIDTH_SLIDER.setValue(textDisplay.lineWidth)
	TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set(
		textDisplay.backgroundColor + floatToHex(textDisplay.backgroundAlpha)
	)
	TEXT_DISPLAY_SHADOW_TOGGLE.set(textDisplay.shadow)
	TEXT_DISPLAY_ALIGNMENT_SELECT.set(textDisplay.align)
	TEXT_DISPLAY_SEE_THROUGH_TOGGLE.set(textDisplay.seeThrough)

	requestAnimationFrame(() => {
		lineWidthSlot.appendChild(TEXT_DISPLAY_WIDTH_SLIDER.node)
		backgroundColorSlot.appendChild(TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.node)
		shadowSlot.appendChild(TEXT_DISPLAY_SHADOW_TOGGLE.node)
		alignmentSlot.appendChild(TEXT_DISPLAY_ALIGNMENT_SELECT.node)
		seeThroughSlot.appendChild(TEXT_DISPLAY_SEE_THROUGH_TOGGLE.node)
		forceNoWrap()
	})

	function forceNoWrap() {
		if (!codeJar) return
		codeJar.$$.ctx[0].style.overflowWrap = 'unset'
		codeJar.$$.ctx[0].style.whiteSpace = 'nowrap'
	}
</script>

<p class="panel_toolbar_label label">
	{translate('panel.text_display.title')}
</p>

<div class="toolbar custom-toolbar">
	<div class="content" bind:this={lineWidthSlot}></div>
	<div class="content" bind:this={backgroundColorSlot}></div>
	<div class="content" bind:this={shadowSlot}></div>
	<div class="content" bind:this={alignmentSlot}></div>
	<div class="content" bind:this={seeThroughSlot}></div>
</div>

<div class="toolbar" style="margin-bottom: 16px;">
	<div class="content">
		<CodeJar
			on:change={() => forceNoWrap()}
			syntax="json"
			{highlight}
			bind:this={codeJar}
			bind:value={$TEXT}
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
				overflow-wrap: unset;
				overflow-y: auto;
				white-space: nowrap;
				margin-top: 0px;
				margin-left: 2px;
			"
		/>
	</div>
	{#if $ERROR}
		<textarea readonly>{$ERROR}</textarea>
	{/if}
</div>

<style>
	.label {
		margin-bottom: -3px !important;
	}
	textarea {
		margin-right: 20px;
		margin-left: 2px;
		color: var(--color-error);
		background-color: var(--color-back);
		padding: 4px 8px;
		text-wrap: pretty;
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
		margin: 2px 0px !important;
	}
	.custom-toolbar :global([toolbar_item='animated_java:textDisplayShadowToggle']) {
		margin-right: 2px !important;
	}
	.custom-toolbar :global(.bar_select) {
		height: 28px !important;
		margin: 2px 0px !important;
	}
	.custom-toolbar :global(bb-select) {
		height: 28px !important;
		display: flex;
		align-items: center;
		padding-top: 0;
	}
</style>
