<script lang="ts">
	import { onDestroy } from 'svelte'
	import { roundToNth } from '../../util/misc'
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: Valuable<number>
	export let defaultValue: number
	export let min = -Infinity
	export let max = Infinity
	/** Minimum difference between two unique values */
	export let valueStep = 0.1
	/** How much to change when dragging */
	export let dragStep: number | undefined = valueStep

	let input: HTMLInputElement
	let slider: HTMLElement

	const clampValue = (v: number) => {
		return Math.clamp(roundToNth(v, 1 / (valueStep ?? 1)), min, max) || 0
	}

	const onStartDrag = (moveEvent: MouseEvent | TouchEvent) => {
		const mouseStartEvent = convertTouchEvent(moveEvent)
		const originalValue = value.get()

		const drag = (moveEvent: MouseEvent | TouchEvent) => {
			const mouseEndEvent = convertTouchEvent(moveEvent)
			const diff =
				Math.trunc((mouseEndEvent.clientX - mouseStartEvent.clientX) / 10) * (dragStep ?? 1)
			const adjustedValue = clampValue(originalValue + diff)
			if (adjustedValue !== value.get()) {
				value.set(adjustedValue)
			}
		}

		addEventListeners(document, 'mousemove touchmove', drag)
		addEventListeners(
			document,
			'mouseup touchend',
			() => removeEventListeners(document, 'mousemove touchmove', drag), // End drag
			{ once: true }
		)
	}

	const MOLANG_PARSER = new Molang()
	const onInput = () => {
		value.set(clampValue(MOLANG_PARSER.parse(value.get())))
	}

	// onMount
	requestAnimationFrame(() => {
		addEventListeners(slider, 'mousedown touchstart', onStartDrag)
		addEventListeners(input, 'focusout dblclick', onInput)
	})

	onDestroy(() => {
		removeEventListeners(input, 'focusout dblclick', onInput)
		removeEventListeners(slider, 'mousedown touchstart', onStartDrag)
	})

	function onReset() {
		value.set(defaultValue)
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<div class="numeric_input">
			<input
				bind:this={input}
				{id}
				class="dark_bordered focusable_input"
				bind:value={$value}
				inputmode="decimal"
			/>
			<div bind:this={slider} class="tool numaric_input_slider slider-fix">
				<i class="material-icons icon">code</i>
			</div>
		</div>
	</div>
</BaseDialogItem>

<style>
	input {
		padding: 0 8px !important;
	}
	.slider-fix {
		right: 8px !important;
	}
</style>
