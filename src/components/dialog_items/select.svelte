<script lang="ts">
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let options: Record<string, string>
	export let defaultOption: string
	export let value: string | undefined = undefined

	let container: HTMLDivElement

	value ??= defaultOption

	// @ts-ignore
	const selectInput = new Interface.CustomElements.SelectInput('test', {
		options,
		value,
		onChange() {
			value = selectInput.node.value
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
