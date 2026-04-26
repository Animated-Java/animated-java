<script lang="ts" module>
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	import type { ValueCheckResult } from './sidebarDialogTypes'
</script>

<script lang="ts">
	interface Props {
		label: string
		description?: string
		step?: number

		valueX: number
		minX?: number
		maxX?: number

		valueY: number
		minY?: number
		maxY?: number

		checkValue?: (valueX: number, valueY: number) => ValueCheckResult
	}

	let {
		label,
		description,
		step,

		valueX = $bindable(),
		minX = $bindable(),
		maxX = $bindable(),

		valueY = $bindable(),
		minY = $bindable(),
		maxY = $bindable(),

		checkValue,
	}: Props = $props()

	let error = $state<string | undefined>()
	let warning = $state<string | undefined>()

	$effect(() => {
		if (!checkValue) return

		const result = checkValue(Number(valueX), Number(valueY))

		if (!result) {
			error = undefined
			warning = undefined
		} else if (result.type === 'error') {
			error = result.message
			warning = undefined
		} else if (result.type === 'warning') {
			error = undefined
			warning = result.message
		}
	})

	let inputX = $state<HTMLInputElement>()
	let inputY = $state<HTMLInputElement>()

	function onMousedown(input: HTMLInputElement, event: any) {
		event.preventDefault()
		convertTouchEvent(event)

		let lastDifference = 0
		function move(e2: any) {
			convertTouchEvent(e2)
			let difference = Math.trunc((e2.clientX - event.clientX) / 10) * (step ?? 1)
			if (difference != lastDifference) {
				input.value = Math.clamp(
					parseFloat(input.value) + (difference - lastDifference),
					input === inputX ? (minX ?? -Infinity) : (minY ?? -Infinity),
					input === inputX ? (maxX ?? Infinity) : (maxY ?? Infinity)
				).toString()
				lastDifference = difference
			}
		}
		function stop() {
			removeEventListeners(document, 'mousemove touchmove', move)
			removeEventListeners(document, 'mouseup touchend', stop)
		}
		addEventListeners(document, 'mousemove touchmove', move)
		addEventListeners(document, 'mouseup touchend', stop)
	}

	function onFocusOut(input: HTMLInputElement, min?: number, max?: number) {
		input.value = Math.clamp(
			Animator.MolangParser.parse(input.value),
			min ?? -Infinity,
			max ?? Infinity
		).toString()
	}
</script>

<BaseSidebarDialogItem {label} {description} {error} {warning}>
	{#snippet children(id)}
		<div class="vector2-inputs" {id}>
			<div
				class="numaric_input numaric-input-fix {error ? 'error' : ''} {warning
					? 'warning'
					: ''}"
				{id}
			>
				<input
					inputmode="decimal"
					bind:this={inputX}
					class="dark_bordered focusable_input"
					bind:value={valueX}
					onfocusout={() => onFocusOut(inputX!, minX, maxX)}
				/>
				<div
					class="tool numaric_input_slider slider-fix"
					onmousedown={e => onMousedown(inputX!, e)}
					ontouchstart={e => onMousedown(inputX!, e)}
				>
					<i class="material-icons icon">code</i>
				</div>
			</div>

			<div
				class="numaric_input numaric-input-fix {error ? 'error' : ''} {warning
					? 'warning'
					: ''}"
				{id}
			>
				<input
					inputmode="decimal"
					bind:this={inputY}
					class="dark_bordered focusable_input"
					bind:value={valueY}
					onfocusout={() => onFocusOut(inputY!, minY, maxY)}
				/>
				<div
					class="tool numaric_input_slider slider-fix"
					onmousedown={e => onMousedown(inputY!, e)}
					ontouchstart={e => onMousedown(inputY!, e)}
				>
					<i class="material-icons icon">code</i>
				</div>
			</div>
		</div>
	{/snippet}
</BaseSidebarDialogItem>

<style>
	.vector2-inputs {
		display: flex;
		gap: 8px;
	}

	.numaric-input-fix {
		position: relative;
		width: fit-content;
	}

	.slider-fix {
		position: absolute;
		top: 0;
		right: 0;

		cursor: ew-resize;
	}

	input {
		border-radius: 0;
		transition: outline 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}

	.error {
		outline: 2px solid var(--color-error);
	}

	.warning {
		outline: 2px solid var(--color-warning);
	}
</style>
