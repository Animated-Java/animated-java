<script lang="ts">
	import { onDestroy } from 'svelte'
	import { PACKAGE } from '../../constants'
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: Valuable<string>

	let colorPicker = new ColorPicker(`${PACKAGE.name}:${label}-color_picker`, {
		onChange() {
			// @ts-ignore
			const color = colorPicker.get() as tinycolor.Instance
			value.set(color.toHexString())
		},
	})
	let colorPickerMount: HTMLDivElement

	function onLoad(el: HTMLDivElement) {
		colorPicker.toElement(el)
		colorPicker.set(value.get())
	}

	onDestroy(() => {
		colorPicker.delete()
	})
</script>

<BaseDialogItem {label} {tooltip}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="export">{label}</label>
		<div bind:this={colorPickerMount} use:onLoad />
	</div>
</BaseDialogItem>
