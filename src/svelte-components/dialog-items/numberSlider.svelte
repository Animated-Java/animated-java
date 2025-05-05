<script lang="ts">
	import { Syncable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''
	export let value: Syncable<number>
	export let defaultValue: number
	export let min: number | undefined = undefined
	export let max: number | undefined = undefined
	export let step: number | undefined = undefined

	const MOLANG_PARSER = new Molang()

	let input: HTMLInputElement
	let slider: HTMLElement

	requestAnimationFrame(() => {
		addEventListeners(slider, 'mousedown touchstart', (e1: any) => {
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
						) || 0
					)
					lastDifference = difference
				}
			}
			function stop() {
				removeEventListeners(document, 'mousemove touchmove', move)
				removeEventListeners(document, 'mouseup touchend', stop)
			}
			addEventListeners(document as unknown as any, 'mousemove touchmove', move)
			addEventListeners(document as unknown as any, 'mouseup touchend', stop)
		})

		addEventListeners(input, 'focusout dblclick', () => {
			value.set(
				Math.clamp(MOLANG_PARSER.parse(value.get()), min ?? -Infinity, max ?? Infinity) || 0
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
