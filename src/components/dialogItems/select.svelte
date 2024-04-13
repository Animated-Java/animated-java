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
	const selectInput = new Interface.CustomElements.SelectInput('test', {
		options,
		value: value.get(),
		onChange() {
			value.set(selectInput.node.getAttribute('value'))
		},
	})

	requestAnimationFrame(() => {
		container.appendChild(selectInput.node)
	})
</script>

<BaseDialogItem {tooltip}>
	<div bind:this={container} class="dialog_bar form_bar">
		<label class="name_space_left" for="name">{label}</label>
	</div>
</BaseDialogItem>
