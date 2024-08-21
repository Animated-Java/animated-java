<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: Valuable<number>
	export let defaultValue: number
	export let min: number | undefined = undefined
	export let max: number | undefined = undefined
	export let step: number | undefined = undefined

	const molangParser = new Molang()

	let input: HTMLInputElement
	let slider: HTMLElement

	requestAnimationFrame(() => {
		addEventListeners(slider, 'mousedown touchstart', (e1: any) => {
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
						) || 0,
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

		addEventListeners(input, 'focusout dblclick', () => {
			value.set(
				Math.clamp(
					molangParser.parse(value.get()),
					min !== undefined ? min : -Infinity,
					max !== undefined ? max : Infinity,
				) || 0,
			)
		})
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
			<div bind:this={slider} class="tool numaric_input_slider">
				<i class="material-icons icon">code</i>
			</div>
		</div>
	</div>
</BaseDialogItem>
