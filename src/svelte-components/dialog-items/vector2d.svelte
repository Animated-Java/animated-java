<script lang="ts">
	import { Syncable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''

	export let step: number | undefined = undefined

	export let valueX: Syncable<number>
	export let defaultValueX: number
	export let minX: number | undefined = undefined
	export let maxX: number | undefined = undefined

	export let valueY: Syncable<number>
	export let defaultValueY: number
	export let minY: number | undefined = undefined
	export let maxY: number | undefined = undefined

	export let valueChecker: DialogItemValueChecker<{ x: number; y: number }> = undefined

	let warningText = ''
	let errorText = ''

	function checkValue() {
		if (!valueChecker) return
		const result = valueChecker({ x: valueX.get(), y: valueY.get() })
		result.type === 'error' ? (errorText = result.message) : (errorText = '')
		result.type === 'warning' ? (warningText = result.message) : (warningText = '')
	}
	valueX.subscribe(() => checkValue())
	valueY.subscribe(() => checkValue())

	const MOLANG_PARSER = new Molang()

	let inputX: HTMLInputElement
	let sliderX: HTMLElement

	let inputY: HTMLInputElement
	let sliderY: HTMLElement

	function eventListenerFactory(
		target: HTMLElement,
		value: Syncable<number>,
		min?: number,
		max?: number
	) {
		addEventListeners(target, 'mousedown touchstart', (e1: any) => {
			convertTouchEvent(e1)
			let lastDifference = 0
			function move(e2: any) {
				convertTouchEvent(e2)
				const difference = Math.trunc((e2.clientX - e1.clientX) / 10) * (step ?? 1)
				if (difference != lastDifference) {
					value.set(
						Math.clamp(
							value.get() + (difference - lastDifference),
							min ?? -Infinity,
							max ?? Infinity
						)
					)
					lastDifference = difference
				}
			}
			function stop() {
				removeEventListeners(document, 'mousemove touchmove', move, undefined)
				removeEventListeners(document, 'mouseup touchend', stop, undefined)
			}
			addEventListeners(document as unknown as any, 'mousemove touchmove', move)
			addEventListeners(document as unknown as any, 'mouseup touchend', stop)
		})

		addEventListeners(inputX, 'focusout dblclick', () => {
			value.set(
				Math.clamp(MOLANG_PARSER.parse(value.get()), min ?? -Infinity, max ?? Infinity)
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

<BaseDialogItem {label} {tooltip} {onReset} bind:warningText bind:errorText let:id>
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
