<script lang="ts">
	import { onDestroy, untrack } from 'svelte'
	import { PACKAGE } from '../../constants'
	import {
		normalizeTintColor,
		tintColorFromHex,
		tintColorToHex,
	} from '../../systems/minecraft/tintSources'
	import { localize } from '../../util/lang'

	interface Props {
		id: string
		/** Shown as the picker's tooltip. */
		label: string
		/** Whether the color keeps its alpha channel (ARGB) instead of being RGB. */
		alpha: boolean
		value: number
		onChange: (value: number) => void
	}

	let { id, label, alpha, value, onChange }: Props = $props()

	const colorPicker = new ColorPicker(`${PACKAGE.name}:tint_color_picker-${guid()}`, {
		// Without a name, Blockbench's tooltip falls back to the untranslated `action.<id>` key.
		name: untrack(() => label),
		// Keeps these short-lived pickers out of the keybinding and action lists.
		private: true,
		onChange: color =>
			onChange(tintColorFromHex(alpha ? color.toHex8String() : color.toHexString(), alpha)),
	})

	$effect(() => {
		// Spectrum has no way to opt out of alpha through ColorPicker's constructor.
		// @ts-expect-error - Spectrum's jQuery plugin isn't typed
		colorPicker.jq.spectrum('option', 'showAlpha', alpha)
		colorPicker.set(tintColorToHex(value, alpha))
	})

	onDestroy(() => colorPicker.delete())

	function mountColorPicker(el: HTMLDivElement) {
		colorPicker.toElement(el)
	}

	function onIntChange(event: Event & { currentTarget: HTMLInputElement }) {
		const normalized = normalizeTintColor(Number(event.currentTarget.value), alpha)
		event.currentTarget.value = String(normalized)
		onChange(normalized)
	}
</script>

<div class="tint-color">
	<div use:mountColorPicker></div>
	<div class="int">
		<input {id} class="dark_bordered" type="number" step="1" {value} onchange={onIntChange} />
		{#if alpha}
			<span class="argb" title={localize('dialog.item_properties.alpha_tooltip')}>ARGB</span>
		{/if}
	</div>
</div>

<style>
	.tint-color {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-grow: 1;
		min-width: 0;
	}

	.int {
		position: relative;
		flex-grow: 1;
		min-width: 0;
	}

	.int input {
		width: 100%;
	}

	.argb {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 12px;
		letter-spacing: 0.04em;
		color: var(--color-subtle_text);
		cursor: help;
	}
</style>
