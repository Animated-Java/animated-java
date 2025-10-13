<script lang="ts" context="module">
	import { CodeJar } from '@novacbn/svelte-codejar'
	import { Stopwatch } from 'src/util/stopwatch'
	import { onDestroy } from 'svelte'
	import {
		TEXT_DISPLAY_ALIGNMENT_SELECT,
		TEXT_DISPLAY_BACKGROUND_COLOR_PICKER,
		TEXT_DISPLAY_COPY_TEXT_ACTION,
		TEXT_DISPLAY_SEE_THROUGH_TOGGLE,
		TEXT_DISPLAY_SHADOW_TOGGLE,
		TEXT_DISPLAY_WIDTH_SLIDER,
	} from '../interface/panel/textDisplayElement'
	import { TextDisplay } from '../outliner/textDisplay'
	import EVENTS from '../util/events'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'

	const HIGHLIGHT_CACHE = new Map<string, string>()

	function highlight(code: string, syntax?: string) {
		if (!syntax) return code
		const cached = HIGHLIGHT_CACHE.get(code)
		if (cached) return cached
		if (code.length > 10000) {
			console.warn('Skipping syntax highlighting due to large text size')
			return code
		}
		const stopwatch = new Stopwatch('Highlighting').start()
		const result = Prism.highlight(code, Prism.languages[syntax], syntax)
		stopwatch.debug(result)
		HIGHLIGHT_CACHE.set(code, result)
		return result
	}
</script>

<script lang="ts">
	let selected = TextDisplay.selected.at(0)

	let text = new Valuable(selected?.text ?? '')

	let error = selected?.textError ?? new Valuable('')

	let codeJarElement: HTMLPreElement | undefined

	let lineWidthSlot: HTMLDivElement
	let backgroundColorSlot: HTMLDivElement
	let shadowSlot: HTMLDivElement
	let alignmentSlot: HTMLDivElement
	let seeThroughSlot: HTMLDivElement
	let copyTextSlot: HTMLDivElement

	let unsubFromText: (() => void) | undefined

	const unsubFromEvent = EVENTS.UPDATE_SELECTION.subscribe(() => {
		unsubFromText?.()

		selected = TextDisplay.selected.at(0)
		if (!selected || Group.first_selected) {
			$text = ''
			error = new Valuable('')
			return
		}

		$text = selected.text
		error = selected.textError

		// Force the inputs to update
		TEXT_DISPLAY_WIDTH_SLIDER.setValue(selected.lineWidth)
		const color = tinycolor(selected.backgroundColor)
		TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set(color)
		TEXT_DISPLAY_SHADOW_TOGGLE.set(selected.shadow)
		TEXT_DISPLAY_ALIGNMENT_SELECT.set(selected.align)
		TEXT_DISPLAY_SEE_THROUGH_TOGGLE.set(selected.seeThrough)

		text.subscribe(v => {
			console.log('Text changed:', v)
			if (!selected) return
			selected.text = v
		})
	})

	requestAnimationFrame(() => {
		lineWidthSlot.appendChild(TEXT_DISPLAY_WIDTH_SLIDER.node)
		backgroundColorSlot.appendChild(TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.node)
		shadowSlot.appendChild(TEXT_DISPLAY_SHADOW_TOGGLE.node)
		alignmentSlot.appendChild(TEXT_DISPLAY_ALIGNMENT_SELECT.node)
		seeThroughSlot.appendChild(TEXT_DISPLAY_SEE_THROUGH_TOGGLE.node)
		copyTextSlot.appendChild(TEXT_DISPLAY_COPY_TEXT_ACTION.node)
		forceNoWrap()
	})

	function forceNoWrap() {
		if (!codeJarElement) return
		codeJarElement.style.overflowWrap = 'unset'
		codeJarElement.style.whiteSpace = 'pre'
	}

	const onKeydown = (e: Event) => {
		if (!(e instanceof KeyboardEvent)) return
		if (e.key === 'Tab') {
			e.stopPropagation()
		} else if (e.code === 'KeyZ' && e.ctrlKey) {
			// CodeJar doesn't capture undo correctly. So we have to fudge it a little.
			requestAnimationFrame(() => {
				if (selected && codeJarElement?.textContent != undefined) {
					$text = codeJarElement.textContent
				}
			})
		}
	}

	onDestroy(() => {
		unsubFromEvent()
	})
</script>

<p class="panel_toolbar_label label" style={!!selected ? '' : 'visibility:hidden; height: 0px;'}>
	{translate('panel.text_display.title')}
</p>

<div
	class="toolbar text-display-toolbar"
	style={!!selected ? '' : 'visibility:hidden; height: 0px;'}
>
	<div class="content" bind:this={lineWidthSlot} />
	<div class="content" bind:this={backgroundColorSlot} />
	<div class="content" bind:this={shadowSlot} />
	<div class="content" bind:this={alignmentSlot} />
	<div class="content" bind:this={seeThroughSlot} />
	<div class="content" bind:this={copyTextSlot} />
</div>

<div
	class="toolbar text-display-text-toolbar"
	style={!!selected ? 'margin-bottom: 16px;' : 'visibility:hidden; height: 0px;'}
>
	<div class="content codejar-container" on:keydown={onKeydown}>
		<CodeJar
			bind:element={codeJarElement}
			syntax="snbtTextComponent"
			{highlight}
			bind:value={$text}
			on:change={() => forceNoWrap()}
			preserveIdent
			history
			style="
				background-color: var(--color-back);
				font-family: var(--font-code);
				font-size: 14px;
				padding: 3px 6px;
				max-height: 20em;
				height: fit-content;
				min-height: 5rem;
				width: 100%;
				outline: none;
				overflow-wrap: unset;
				overflow-y: scroll;
				white-space: pre;
				margin: 8px;
				margin-bottom: 0px;
				{$error
				? 'border: 1px solid var(--color-error); border-bottom: none; border-radius: 0.3em 0.3em 0 0;'
				: 'border: 1px solid var(--color-border);'}
				text-shadow: 0px 1px rgba(0, 0, 0, 0.3);
			"
		/>
		{#if $error}
			<textarea readonly rows={$error.split('\n').length + 1}>{$error}</textarea>
		{/if}
	</div>
</div>

<style>
	.label {
		margin-bottom: -3px !important;
	}
	.text-display-text-toolbar {
		display: flex;
	}
	textarea {
		color: var(--color-error);
		background-color: var(--color-back);
		padding: 3px 6px;
		overflow: auto;
		height: min-content;
		font-size: 14px;
		font-family: var(--font-code);
		width: -webkit-fill-available;
		margin: 8px;
		margin-top: 0px;
		border-radius: 0 0 0.3em 0.3em;
		border: 1px solid var(--color-error);
		white-space: pre;
		tab-size: 4;
	}
	.codejar-container {
		width: 100%;
	}
	.codejar-container :global(.language-snbtTextComponent) {
		& .brackets {
			color: #5ba8c5;
		}
		& .token.punctuation {
			color: #89ddff;
		}
		& .token.property {
			color: #eeffff;
		}
		& .token.escape-sequence {
			color: #89ddff;
		}
		& .token.constant {
			color: #c767d7;
			border-bottom: 1px solid;
		}
		& .token.number {
			color: #f92672;
		}
		& .token.boolean {
			color: #f78c6c;
		}
		& .token.string {
			color: #aef941;
		}
	}
	.text-display-toolbar {
		display: flex;
		flex-direction: row;
		margin-bottom: 1px;
	}
	.text-display-toolbar :global(.sp-replacer) {
		padding: 4px 18px !important;
		height: 28px !important;
		margin: 2px 0px !important;
	}
	.text-display-toolbar :global([toolbar_item='animated_java:textDisplayShadowToggle']) {
		margin-right: 2px !important;
	}
	.text-display-toolbar :global(.bar_select) {
		height: 28px !important;
		margin: 2px 0px !important;
	}
	.text-display-toolbar :global(bb-select) {
		height: 28px !important;
		display: flex;
		align-items: center;
		padding-top: 0;
	}
</style>
