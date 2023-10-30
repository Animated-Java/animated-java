<script lang="ts">
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''

	export let step: number | undefined = undefined

	export let valueX: number
	export let minX: number | undefined = undefined
	export let maxX: number | undefined = undefined

	$: if (minX !== undefined && valueX < minX) valueX = minX
	$: if (maxX !== undefined && valueX > maxX) valueX = maxX

	export let valueY: number
	export let minY: number | undefined = undefined
	export let maxY: number | undefined = undefined

	$: if (minY !== undefined && valueY < minY) valueY = minY
	$: if (maxY !== undefined && valueY > maxY) valueY = maxY

	const molangParser = new Molang()

	let inputX: HTMLInputElement
	let sliderX: HTMLElement

	let inputY: HTMLInputElement
	let sliderY: HTMLElement

	requestAnimationFrame(() => {
		addEventListeners(sliderX, 'mousedown touchstart', (e1: any) => {
			convertTouchEvent(e1)
			let last_difference = 0
			function move(e2: any) {
				convertTouchEvent(e2)
				let difference = Math.trunc((e2.clientX - e1.clientX) / 10) * (step || 1)
				if (difference != last_difference) {
					valueX = Math.clamp(
						valueX + (difference - last_difference),
						minX !== undefined ? minX : -Infinity,
						maxX !== undefined ? maxX : Infinity
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
			valueX = Math.clamp(
				molangParser.parse(valueX),
				minX !== undefined ? minX : -Infinity,
				maxX !== undefined ? maxX : Infinity
			)
		})

		addEventListeners(sliderY, 'mousedown touchstart', (e1: any) => {
			convertTouchEvent(e1)
			let last_difference = 0
			function move(e2: any) {
				convertTouchEvent(e2)
				let difference = Math.trunc((e2.clientX - e1.clientX) / 10) * (step || 1)
				if (difference != last_difference) {
					valueY = Math.clamp(
						valueY + (difference - last_difference),
						minY !== undefined ? minY : -Infinity,
						maxY !== undefined ? maxY : Infinity
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
	})
</script>

<BaseDialogItem {tooltip}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="name">{label}</label>
		<div class="dialog_vector_group half">
			<div class="numeric_input">
				<input
					bind:this={inputX}
					id="snapping"
					class="dark_bordered focusable_input"
					bind:value={valueX}
					inputmode="decimal"
				/>
				<div bind:this={sliderX} class="tool numaric_input_slider">
					<i class="material-icons icon">code</i>
				</div>
			</div>
			<div class="numeric_input">
				<input
					bind:this={inputY}
					id="snapping"
					class="dark_bordered focusable_input"
					bind:value={valueY}
					inputmode="decimal"
				/>
				<div bind:this={sliderY} class="tool numaric_input_slider">
					<i class="material-icons icon">code</i>
				</div>
			</div>
		</div>
	</div>
</BaseDialogItem>
