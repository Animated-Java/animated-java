<script lang="ts">
	import { roundTo } from '@aj/util/misc'
	import { onDestroy } from 'svelte'

	export let id: string
	export let value: number
	export let min = -Infinity
	export let max = Infinity
	/** Minimum difference between two unique values */
	export let valueStep = 0.1
	/** How much to change when dragging */
	export let dragStep: number | undefined = valueStep

	let input: HTMLInputElement
	let slider: HTMLElement

	function clampValue(value: number) {
		return Math.clamp(roundTo(value, 1 / (valueStep ?? 1)), min, max) || 0
	}

	function onStartDrag(moveEvent: MouseEvent | TouchEvent) {
		const mouseStartEvent = convertTouchEvent(moveEvent)
		const originalValue = value

		function drag(moveEvent: MouseEvent | TouchEvent) {
			const mouseEndEvent = convertTouchEvent(moveEvent)
			const diff =
				Math.trunc((mouseEndEvent.clientX - mouseStartEvent.clientX) / 10) * (dragStep ?? 1)
			const adjustedValue = clampValue(originalValue + diff)
			if (adjustedValue !== value) {
				value = adjustedValue
			}
		}

		function end() {
			removeEventListeners(document, 'mousemove touchmove', drag)
		}
		addEventListeners(document, 'mousemove touchmove', drag)
		addEventListeners(document, 'mouseup touchend', end, { once: true })
	}

	const MOLANG_PARSER = new Molang()
	const onInput = () => {
		value = clampValue(MOLANG_PARSER.parse(value))
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
</script>

<div class="numeric_input">
	<input
		bind:this={input}
		{id}
		class="dark_bordered focusable_input"
		bind:value
		inputmode="decimal"
	/>
	<div bind:this={slider} class="tool numaric_input_slider">
		<i class="material-icons icon">code</i>
	</div>
</div>
