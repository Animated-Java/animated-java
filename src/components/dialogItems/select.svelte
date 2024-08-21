<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let options: Record<string, string>
	export let defaultOption: string
	export let value: Valuable<string>

	let container: HTMLDivElement

	if (!(value.get() || options[value.get()])) value.set(defaultOption)

	// @ts-ignore
	const selectInput = new Interface.CustomElements.SelectInput('dialog-select', {
		options,
		value: value.get(),
		onChange() {
			value.set(selectInput.node.getAttribute('value'))
		},
	})

	function onReset() {
		value.set(defaultOption)
		if (selectInput.node) {
			selectInput.set(defaultOption)
		}
	}

	requestAnimationFrame(() => {
		container.appendChild(selectInput.node)
	})
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div bind:this={container} class="dialog_bar form_bar">
		<label class="name_space_left" for={id}>{label}</label>
	</div>
</BaseDialogItem>
