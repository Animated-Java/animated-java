<script lang="ts">
	import { onDestroy } from 'svelte'
	import { PACKAGE } from '../../constants'
	import { Syncable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''
	export let value: Syncable<string>

	const COLOR_PICKER = new ColorPicker(`${PACKAGE.name}:${label}-color_picker`, {
		onChange() {
			const color = COLOR_PICKER.get() as tinycolor.Instance
			value.set(color.toHexString())
		},
	})
	let colorPickerMount: HTMLDivElement

	function onLoad(el: HTMLDivElement) {
		COLOR_PICKER.toElement(el)
		COLOR_PICKER.set(value.get())
	}

	function onReset() {
		value.set('#ffffff')
	}

	onDestroy(() => {
		COLOR_PICKER.delete()
	})
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<div bind:this={colorPickerMount} use:onLoad />
	</div>
</BaseDialogItem>
