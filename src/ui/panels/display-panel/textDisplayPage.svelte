<script lang="ts">
	// import { floatToHex } from '@aj/util/misc'
	// import { CodeJar } from '@novacbn/svelte-codejar'
	// import {
	// 	TEXT_DISPLAY_ALIGNMENT_SELECT,
	// 	TEXT_DISPLAY_BACKGROUND_COLOR_PICKER,
	// 	TEXT_DISPLAY_SEE_THROUGH_TOGGLE,
	// 	TEXT_DISPLAY_SHADOW_TOGGLE,
	// 	TEXT_DISPLAY_WIDTH_SLIDER,
	// } from '.'

	// function highlight(code: string, syntax?: string) {
	// 	if (!syntax) return code
	// 	return Prism.highlight(code, Prism.languages[syntax], syntax)
	// }

	// // @ts-expect-error
	// const TEXT = textDisplay.__text
	// const ERROR = textDisplay.textError

	// let lineWidthSlot: HTMLDivElement
	// let backgroundColorSlot: HTMLDivElement
	// let shadowSlot: HTMLDivElement
	// let alignmentSlot: HTMLDivElement
	// let seeThroughSlot: HTMLDivElement
	// let codeJar: CodeJar

	// // Force the inputs to update
	// TEXT_DISPLAY_WIDTH_SLIDER.setValue(textDisplay.lineWidth)
	// TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set(
	// 	textDisplay.backgroundColor + floatToHex(textDisplay.backgroundAlpha)
	// )
	// TEXT_DISPLAY_SHADOW_TOGGLE.set(textDisplay.shadow)
	// TEXT_DISPLAY_ALIGNMENT_SELECT.set(textDisplay.align)
	// TEXT_DISPLAY_SEE_THROUGH_TOGGLE.set(textDisplay.seeThrough)

	// requestAnimationFrame(() => {
	// 	lineWidthSlot.appendChild(TEXT_DISPLAY_WIDTH_SLIDER.node)
	// 	backgroundColorSlot.appendChild(TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.node)
	// 	shadowSlot.appendChild(TEXT_DISPLAY_SHADOW_TOGGLE.node)
	// 	alignmentSlot.appendChild(TEXT_DISPLAY_ALIGNMENT_SELECT.node)
	// 	seeThroughSlot.appendChild(TEXT_DISPLAY_SEE_THROUGH_TOGGLE.node)
	// 	forceNoWrap()
	// })

	// function forceNoWrap() {
	// 	if (!codeJar) return
	// 	codeJar.$$.ctx[0].style.overflowWrap = 'unset'
	// 	codeJar.$$.ctx[0].style.whiteSpace = 'nowrap'
	// }

	import { TextDisplay } from '@aj/blockbench-additions/outliner-elements/textDisplay'
	import { TextDisplayConfig } from '@aj/systems/node-configs'
	import EVENTS from '@aj/util/events'

	export let textDisplay: TextDisplay

	const CONFIG = new TextDisplayConfig().fromJSON(textDisplay.config)
	const LINK_STATES = CONFIG.getAllLinkedStates()

	export const resetUniqueOptions = () => {
		for (const key of CONFIG.keys()) {
			CONFIG.set(key, undefined)
			CONFIG.setKeyInheritance(key, true)
			LINK_STATES.set(key, true)
		}

		Undo.initEdit({ elements: [textDisplay] })
		textDisplay.config = CONFIG.toJSON()
		Undo.finishEdit(`Reset Text Display config`, {
			elements: [textDisplay],
		})

		EVENTS.UPDATE_SELECTION.dispatch()
	}

	// Key is a string, but I need it to be any to make TypeScript happy when indexing into the config object.
	function toggleLinked(key: any) {
		if (!CONFIG || !LINK_STATES) {
			console.error('Attempted to cycle common mode without a common config')
			return
		}

		const mode = LINK_STATES.get(key)
		if (mode) {
			CONFIG.makeDefault(key)
			CONFIG.setKeyInheritance(key, false)
			LINK_STATES.set(key, false)
		} else {
			CONFIG.set(key, undefined)
			CONFIG.setKeyInheritance(key, true)
			LINK_STATES.set(key, true)
		}

		Undo.initEdit({ elements: [textDisplay] })
		textDisplay.config = CONFIG.toJSON()
		Undo.finishEdit(`Set ${key} inheritance mode to ${mode}`, {
			elements: [textDisplay],
		})

		EVENTS.UPDATE_SELECTION.dispatch()
	}
</script>

<ul class="option-list">
	{#each CONFIG.keys() as key}
		{@const display = CONFIG.getPropertyDescription(key)}
		<li>
			<div>
				<div class="option-title">
					{display?.displayName}
				</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<i
					on:click={() => toggleLinked(key)}
					class="material-icons notranslate icon option-mode-toggle"
				>
					{LINK_STATES.get(key) ? 'edit' : 'delete'}
				</i>
			</div>
			{#if LINK_STATES.get(key) === false}
				{#if display?.displayMode === 'checkbox'}
					<div class="option-value">
						<input type="checkbox" checked={!!CONFIG[key]} />
					</div>
				{:else}
					<div class="option-value">
						<input type="text" value={CONFIG[key]} />
					</div>
				{/if}
			{/if}
		</li>
	{/each}
</ul>

<!-- <div class="toolbar" style="margin-bottom: 16px;">
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
</div> -->

<style>
	/* textarea {
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
	} */
</style>
