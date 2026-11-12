<script lang="ts">
	import { onMount, untrack } from 'svelte'

	interface ISwatchAction {
		label: string
		icon: string
		onclick: () => void
	}

	interface Props {
		/** The swatch the popover opens under. */
		anchor: HTMLElement
		/** The color being edited, as `#rrggbbaa`, or undefined to show only the note and actions. */
		color: string | undefined
		/** Shown above the actions, e.g. why a pack palette can't be edited directly. */
		note?: string
		actions: ISwatchAction[]
		/** Runs as the color changes, so previews update live. */
		oninput: (color: string) => void
		/** `revert` is true when closed with Escape, to undo the edits made while it was open. */
		onclose: (revert: boolean) => void
	}

	let { anchor, color, note, actions, oninput, onclose }: Props = $props()

	let popover: HTMLElement
	let pickerInput: HTMLInputElement | undefined = $state()
	let style = $state('')
	/** The last color the picker itself produced, so outside changes can be told apart. */
	let lastPicked: string | undefined

	function position() {
		const rect = anchor.getBoundingClientRect()
		const height = popover?.offsetHeight ?? 320
		const below = window.innerHeight - rect.bottom
		const top = below < height + 8 && rect.top > below ? rect.top - height - 4 : rect.bottom + 4
		const left = Math.min(rect.left, window.innerWidth - (popover?.offsetWidth ?? 260) - 8)
		style = `top:${Math.max(4, top)}px;left:${Math.max(4, left)}px;`
	}

	// Rendered under <body>, so the dialog's overflow can't clip it.
	function portal(node: HTMLElement) {
		document.body.appendChild(node)
		return { destroy: () => node.remove() }
	}

	const hasColor = $derived(color !== undefined)

	/** False once closing, so the picker's teardown can't write a stale color back. */
	let active = true

	function close(revert: boolean) {
		active = false
		onclose(revert)
	}

	function pick(picked: tinycolor.Instance | null) {
		if (!picked || !active) return
		lastPicked = picked.toHex8String()
		oninput(lastPicked)
	}

	// Spectrum is the color picker Blockbench uses everywhere, shown inline here. It's set up once
	// per color being edited; later changes go through the effect below instead of rebuilding it.
	$effect(() => {
		if (!pickerInput || !hasColor) return
		// Blockbench's jQuery carries Spectrum, the color picker it uses everywhere.
		const picker = jQuery(pickerInput)
		picker.spectrum({
			flat: true,
			color: untrack(() => color),
			showAlpha: true,
			showInput: true,
			showButtons: false,
			preferredFormat: 'hex8',
			// `move` fires while dragging, `change` when a hex value is typed
			move: pick,
			change: pick,
		} as any)
		requestAnimationFrame(position)
		return () => picker.spectrum('destroy')
	})

	// Keep the picker in step when the color changes from outside, like "Reset to key color".
	$effect(() => {
		if (!pickerInput || color === undefined || color === lastPicked) return
		jQuery(pickerInput).spectrum('set', color)
	})

	onMount(() => {
		position()
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node
			if (popover.contains(target) || anchor.contains(target)) return
			// Spectrum's own drag helpers live outside the popover.
			if ((target as Element).closest?.('.sp-container')) return
			close(false)
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			event.stopPropagation()
			close(true)
		}
		window.addEventListener('pointerdown', onPointerDown, true)
		window.addEventListener('keydown', onKeyDown, true)
		window.addEventListener('resize', position)
		return () => {
			active = false
			window.removeEventListener('pointerdown', onPointerDown, true)
			window.removeEventListener('keydown', onKeyDown, true)
			window.removeEventListener('resize', position)
		}
	})
</script>

<div class="swatch-popover" bind:this={popover} {style} use:portal role="dialog">
	{#if color !== undefined}
		<input bind:this={pickerInput} type="text" class="picker" />
	{/if}
	{#if note}
		<div class="note">{note}</div>
	{/if}
	{#if actions.length}
		<div class="actions">
			{#each actions as action (action.label)}
				<button class="action" onclick={() => action.onclick()}>
					<i class="material-icons icon">{action.icon}</i>
					{action.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.swatch-popover {
		position: fixed;
		z-index: 10001;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 220px;
		padding: 8px;
		background: var(--color-ui);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
	}
	.picker {
		display: none;
	}
	/* Spectrum's own markup lives inside the popover, so size its hex input to fit */
	.swatch-popover :global(.sp-container) {
		overflow: visible;
		background: none;
		border: none;
		padding: 0;
	}
	.swatch-popover :global(.sp-picker-container) {
		margin: 0;
		padding: 0;
		border: none;
	}
	.swatch-popover :global(.sp-input-container) {
		width: 100%;
		margin: 6px 0 0;
		float: none;
	}
	.swatch-popover :global(.sp-input) {
		width: 100%;
		height: 26px;
		padding: 2px 6px;
		font-family: var(--font-code, monospace);
		color: inherit;
		background: var(--color-back);
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}
	.note {
		max-width: 240px;
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	/* Undo Blockbench's global dialog button style */
	button.action {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		height: auto;
		min-width: 0;
		margin: 0;
		padding: 4px 6px;
		border: none;
		border-radius: 4px;
		background: none;
		box-shadow: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	button.action:hover {
		background: var(--color-button);
	}
	button.action .icon {
		font-size: 18px;
	}
</style>
