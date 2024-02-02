<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { PACKAGE } from '../../constants'
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: Valuable<number>

	console.log(value)

	let colorPicker = new ColorPicker(`${PACKAGE.name}:${label}-color_picker`, {
		onChange() {
			console.log(colorPicker.get())
		}
	})
	let colorPickerMount: HTMLDivElement

	function onLoad(el: HTMLDivElement) {
		colorPicker.toElement(colorPickerMount)
		// colorPickerMount.appendChild()
		// @ts-ignore
		colorPicker.jq.spectrum('show')
		console.log('colorPicker:', colorPicker.get())
	}

	onDestroy(() => {
		colorPicker.delete()
	})
</script>

<BaseDialogItem {tooltip}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="export">{label}</label>
	</div>
	<div bind:this={colorPickerMount} use:onLoad/>
</BaseDialogItem>
