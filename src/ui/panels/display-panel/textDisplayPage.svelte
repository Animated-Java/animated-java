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
	import { MODE_ICONS, type OptionMode } from '.'

	export let textDisplay: TextDisplay

	let config = new TextDisplayConfig().fromJSON(textDisplay.config)
	const OPTION_MODES = new Map<string, OptionMode>(
		config.keys().map(key => {
			if (config.get(key, 'local') != undefined) {
				return [key, 'custom']
			}
			return [key, 'default']
		})
	)

	// Key is a string, but I need it to be any to make TypeScript happy when indexing into the config object.
	function cycleMode(key: any) {
		if (!textDisplay) {
			console.error('Attempted to cycle common mode without a selected thing')
			return
		}
		if (!config || !OPTION_MODES) {
			console.error('Attempted to cycle common mode without a common config')
			return
		}

		const mode = OPTION_MODES.get(key)
		if (mode === 'default') {
			OPTION_MODES.set(key, 'custom')
			config.makeDefault(key)
		} else {
			OPTION_MODES.set(key, 'default')
			config.set(key, undefined)
			config.setKeyInheritance(key, false)
		}

		console.log('Set', key, 'inheritance mode to', mode?.toUpperCase())
		Undo.initEdit({ elements: [textDisplay] })
		textDisplay.config = config.toJSON()
		Undo.finishEdit(`Set ${key} inheritance mode to ${mode?.toUpperCase()}`, {
			elements: [textDisplay],
		})

		config = config
	}
</script>

<ul class="option-list">
	{#each config.keys(true) as key}
		{@const display = config.getPropertyDescription(key)}
		<li>
			<div>
				<div class="option-title">
					{display?.displayName}
				</div>
				<div class="option-mode">{OPTION_MODES.get(key)}</div>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<i
					on:click={() => cycleMode(key)}
					class="material-icons notranslate icon option-mode-toggle"
				>
					{MODE_ICONS[OPTION_MODES.get(key) ?? 'default']}
				</i>
			</div>
			{#if OPTION_MODES.get(key) === 'custom'}
				{#if display?.displayMode === 'checkbox'}
					<div class="option-value">
						<input type="checkbox" checked={!!config[key]} />
					</div>
				{:else}
					<div class="option-value">
						<input type="text" value={config[key]} />
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
