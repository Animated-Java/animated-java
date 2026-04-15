<script lang="ts">
	import { onDestroy } from 'svelte'
	import { type Observable } from 'svelte-observable-store'
	import { roundToNth } from '../../util/misc'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		value: Observable<number>
		defaultValue: number
		min?: any
		max?: any
		/** Minimum difference between two unique values */
		valueStep?: number
		/** How much to change when dragging */
		dragStep?: number | undefined
	}

	let {
		label,
		tooltip = '',
		value = $bindable(),
		defaultValue,
		min = -Infinity,
		max = Infinity,
		valueStep = 0.1,
		dragStep = valueStep,
	}: Props = $props()

	let input: HTMLInputElement | undefined = $state()
	let slider: HTMLElement | undefined = $state()

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

	const onInput = () => {
		value.set(clampValue(Animator.MolangParser.parse(value.get())))
	}

	// onMount
	requestAnimationFrame(() => {
		addEventListeners(slider!, 'mousedown touchstart', onStartDrag)
		addEventListeners(input!, 'focusout dblclick', onInput)
	})

	onDestroy(() => {
		removeEventListeners(input!, 'focusout dblclick', onInput)
		removeEventListeners(slider!, 'mousedown touchstart', onStartDrag)
	})

	function onReset() {
		value.set(defaultValue)
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset}>
	{#snippet children({ id })}
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
	{/snippet}
</BaseDialogItem>

<style>
	input {
		padding: 0 8px !important;
	}
	.slider-fix {
		right: 8px !important;
	}
</style>
