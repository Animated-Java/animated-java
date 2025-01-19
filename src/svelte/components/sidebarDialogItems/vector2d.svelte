<script lang="ts">
	import { Valuable } from '../../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	export let label: string
	export let description: string
	export let required: boolean = false

	export let step: number | undefined = undefined

	export let valueX: Valuable<number>
	export let defaultValueX: number
	export let minX: number | undefined = undefined
	export let maxX: number | undefined = undefined

	export let valueY: Valuable<number>
	export let defaultValueY: number
	export let minY: number | undefined = undefined
	export let maxY: number | undefined = undefined

	export let valueChecker: DialogItemValueChecker<{ x: number; y: number }> = undefined

	let warning = ''
	let error = ''

	let alertBorder = ''

	$: {
		if (error) {
			alertBorder = 'error-border'
		} else if (warning) {
			alertBorder = 'warning-border'
		} else {
			alertBorder = ''
		}
	}

	$: {
		if (valueChecker) {
			const result = valueChecker({ x: $valueX, y: $valueY })
			result.type === 'warning' ? (warning = result.message) : (warning = '')
			result.type === 'error' ? (error = result.message) : (error = '')
		}
	}

	let inputX: HTMLInputElement
	let sliderX: HTMLElement

	let inputY: HTMLInputElement
	let sliderY: HTMLElement

	const molangParser = new Molang()

	function eventListenerFactory(
		target: HTMLElement,
		value: Valuable<number>,
		min?: number,
		max?: number,
	) {
		addEventListeners(target, 'mousedown touchstart', (e1: any) => {
			convertTouchEvent(e1)
			let last_difference = 0
			function move(e2: any) {
				convertTouchEvent(e2)
				let difference = Math.trunc((e2.clientX - e1.clientX) / 10) * (step || 1)
				if (difference != last_difference) {
					value.set(
						Math.clamp(
							value.get() + (difference - last_difference),
							min !== undefined ? min : -Infinity,
							max !== undefined ? max : Infinity,
						),
					)
					last_difference = difference
				}
			}
			function stop(e2: any) {
				removeEventListeners(document, 'mousemove touchmove', move, null)
				removeEventListeners(document, 'mouseup touchend', stop, null)
			}
			addEventListeners(document as unknown as any, 'mousemove touchmove', move)
			addEventListeners(document as unknown as any, 'mouseup touchend', stop)
		})

		addEventListeners(inputX, 'focusout dblclick', () => {
			value.set(
				Math.clamp(
					molangParser.parse(value.get()),
					min !== undefined ? min : -Infinity,
					max !== undefined ? max : Infinity,
				),
			)
		})
	}

	function onReset() {
		valueX.set(defaultValueX)
		valueY.set(defaultValueY)
	}

	requestAnimationFrame(() => {
		eventListenerFactory(sliderX, valueX, minX, maxX)
		eventListenerFactory(sliderY, valueY, minY, maxY)
	})
</script>

<BaseSidebarDialogItem {label} {required} {description} {warning} {error} let:id>
	<div class="vector2d">
		<div class="numeric_input input {alertBorder}">
			<input
				bind:this={inputX}
				{id}
				class="dark_bordered focusable_input"
				bind:value={$valueX}
				inputmode="decimal"
			/>
			<div bind:this={sliderX} class="tool numaric_input_slider slider">
				<i class="material-icons icon">code</i>
			</div>
		</div>
		<div class="numeric_input input {alertBorder}">
			<input
				bind:this={inputY}
				{id}
				class="dark_bordered focusable_input"
				bind:value={$valueY}
				inputmode="decimal"
			/>
			<div bind:this={sliderY} class="tool numaric_input_slider slider">
				<i class="material-icons icon">code</i>
			</div>
		</div>
	</div>
</BaseSidebarDialogItem>

<style>
	.vector2d {
		display: flex;
		flex-direction: row;
		width: 30%;
		gap: 16px;
		z-index: 1;
		position: relative;
	}
	input {
		padding: 0px 10px;
		outline: 0px;
		transition: outline 0.2s ease;
	}
	.slider {
		margin-right: 8px;
	}
	.reset-button {
		cursor: pointer;
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
	}
	.reset-button:hover {
		color: var(--color-light);
	}
	.error-border {
		outline: 2px solid var(--color-error);
	}
	.warning-border {
		outline: 2px solid var(--color-warning);
	}
</style>
