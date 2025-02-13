<script lang="ts">
	import type { Valuable } from '../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	export let label: string
	export let description: string
	export let required = false

	export let step: number | undefined = undefined

	export let value: Valuable<number>
	// export let defaultValue: number
	export let min: number | undefined = undefined
	export let max: number | undefined = undefined

	export let valueChecker: DialogItemValueChecker<number> = undefined

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
			const result = valueChecker($value)
			result.type === 'warning' ? (warning = result.message) : (warning = '')
			result.type === 'error' ? (error = result.message) : (error = '')
		}
	}

	let input: HTMLInputElement
	let slider: HTMLElement

	const MOLANG_PARSER = new Molang()

	function eventListenerFactory(
		target: HTMLElement,
		value: Valuable<number>,
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
				removeEventListeners(document, 'mousemove touchmove', move, null)
				removeEventListeners(document, 'mouseup touchend', stop, null)
			}
			addEventListeners(document as unknown as any, 'mousemove touchmove', move)
			addEventListeners(document as unknown as any, 'mouseup touchend', stop)
		})

		addEventListeners(input, 'focusout dblclick', () => {
			value.set(
				Math.clamp(MOLANG_PARSER.parse(value.get()), min ?? -Infinity, max ?? Infinity)
			)
		})
	}

	// function onReset() {
	// 	value.set(defaultValue)
	// }

	requestAnimationFrame(() => {
		eventListenerFactory(slider, value, min, max)
	})
</script>

<BaseSidebarDialogItem {label} {required} {description} {warning} {error} let:id>
	<div class="numslider {alertBorder}" slot="before">
		<div class="numeric_input input">
			<input
				bind:this={input}
				{id}
				class="dark_bordered focusable_input"
				bind:value={$value}
				inputmode="decimal"
			/>
			<div bind:this={slider} class="tool numaric_input_slider slider">
				<i class="material-icons icon">code</i>
			</div>
		</div>
	</div>
</BaseSidebarDialogItem>

<style>
	.numslider {
		width: 12%;
		margin-right: 16px;
		z-index: 1;
	}
	input {
		padding: 0px 10px;
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
		border: 2px solid var(--color-error);
	}
	.warning-border {
		border: 2px solid var(--color-warning);
	}
</style>
