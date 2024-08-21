<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''

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

	let warning_text = ''
	let error_text = ''

	function checkValue() {
		if (!valueChecker) return
		const result = valueChecker({ x: valueX.get(), y: valueY.get() })
		result.type === 'error' ? (error_text = result.message) : (error_text = '')
		result.type === 'warning' ? (warning_text = result.message) : (warning_text = '')
	}
	valueX.subscribe(() => checkValue())
	valueY.subscribe(() => checkValue())

	const molangParser = new Molang()

	let inputX: HTMLInputElement
	let sliderX: HTMLElement

	let inputY: HTMLInputElement
	let sliderY: HTMLElement

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

<BaseDialogItem {label} {tooltip} {onReset} bind:warning_text bind:error_text let:id>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<div class="dialog_vector_group half" style="max-width: 256px;">
			<div class="numeric_input">
				<input
					bind:this={inputX}
					{id}
					class="dark_bordered focusable_input"
					bind:value={$valueX}
					inputmode="decimal"
				/>
				<div bind:this={sliderX} class="tool numaric_input_slider">
					<i class="material-icons icon">code</i>
				</div>
			</div>
			<div class="numeric_input">
				<input
					bind:this={inputY}
					{id}
					class="dark_bordered focusable_input"
					bind:value={$valueY}
					inputmode="decimal"
				/>
				<div bind:this={sliderY} class="tool numaric_input_slider">
					<i class="material-icons icon">code</i>
				</div>
			</div>
		</div>
	</div>
</BaseDialogItem>
