<script lang="ts">
	interface Props {
		id: string
		value: number
		min?: number
		max?: number
		step?: number
		/** Truncates the value to a whole number. */
		integer?: boolean
		onChange: (value: number) => void
	}

	let { id, value, min, max, step, integer = false, onChange }: Props = $props()

	let numericInput: Interface.CustomElements.NumericInput | undefined

	const normalize = (input: number) => {
		const finite = Number.isFinite(input) ? input : (min ?? 0)
		return integer ? Math.trunc(finite) : finite
	}

	// Keep the field in sync with outside changes, but never rewrite it mid-typing.
	$effect(() => {
		const current = value
		const input = numericInput?.node.querySelector('input')
		if (!numericInput || document.activeElement === input) return
		if (numericInput.value !== current) numericInput.value = current
	})

	function mountNumericInput(el: HTMLDivElement) {
		numericInput = new Interface.CustomElements.NumericInput(id, {
			value,
			min,
			max,
			step,
			onChange: input => onChange(normalize(input)),
		})
		numericInput.node.querySelector('input')!.addEventListener('focusout', () => {
			numericInput!.value = value
		})
		el.appendChild(numericInput.node)
	}
</script>

<div class="tint-number" use:mountNumericInput></div>

<style>
	.tint-number {
		display: flex;
		flex-grow: 1;
		min-width: 0;
	}
</style>
