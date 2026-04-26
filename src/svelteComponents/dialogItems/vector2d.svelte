<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		step?: number | undefined
		valueX: Observable<number>
		defaultValueX: number
		minX?: number | undefined
		maxX?: number | undefined
		valueY: Observable<number>
		defaultValueY: number
		minY?: number | undefined
		maxY?: number | undefined
		valueChecker?: DialogItemValueChecker<{ x: number; y: number }>
	}

	let {
		label,
		tooltip = '',
		step = undefined,
		valueX = $bindable(),
		defaultValueX,
		minX = undefined,
		maxX = undefined,
		valueY = $bindable(),
		defaultValueY,
		minY = undefined,
		maxY = undefined,
		valueChecker = undefined,
	}: Props = $props()

	let warningText = $state('')
	let errorText = $state('')

	function checkValue() {
		if (!valueChecker) return
		const result = valueChecker({ x: valueX.get(), y: valueY.get() })
		result.type === 'error' ? (errorText = result.message) : (errorText = '')
		result.type === 'warning' ? (warningText = result.message) : (warningText = '')
	}

	$effect.pre(() => {
		valueX.subscribe(() => checkValue())
		valueY.subscribe(() => checkValue())
	})

	let inputX: HTMLInputElement | undefined = $state()
	let sliderX: HTMLElement | undefined = $state()

	let inputY: HTMLInputElement | undefined = $state()
	let sliderY: HTMLElement | undefined = $state()

	function eventListenerFactory(
		target: HTMLElement,
		value: Observable<number>,
		min?: number,
		max?: number
	) {
		addEventListeners(target, 'mousedown touchstart', (e1: any) => {
			convertTouchEvent(e1)
			let lastDifference = 0
			function move(e2: any) {
				convertTouchEvent(e2)
				let difference = Math.trunc((e2.clientX - e1.clientX) / 10) * (step ?? 1)
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
				removeEventListeners(document, 'mousemove touchmove', move)
				removeEventListeners(document, 'mouseup touchend', stop)
			}
			addEventListeners(document, 'mousemove touchmove', move)
			addEventListeners(document, 'mouseup touchend', stop)
		})

		addEventListeners(target, 'focusout dblclick', () => {
			value.set(
				Math.clamp(
					Animator.MolangParser.parse(value.get()),
					min ?? -Infinity,
					max ?? Infinity
				)
			)
		})
	}

	function onReset() {
		valueX.set(defaultValueX)
		valueY.set(defaultValueY)
	}

	requestAnimationFrame(() => {
		eventListenerFactory(sliderX!, valueX, minX, maxX)
		eventListenerFactory(sliderY!, valueY, minY, maxY)
	})
</script>

<BaseDialogItem {label} {tooltip} {onReset} bind:warningText bind:errorText>
	{#snippet children({ id })}
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
	{/snippet}
</BaseDialogItem>
