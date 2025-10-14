<script lang="ts">
	import { onDestroy } from 'svelte'
	import { PACKAGE } from '../../constants'
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''
	export let defaultValue = '#ffffff'
	export let value: Valuable<string>

	let colorPicker = new ColorPicker(`${PACKAGE.name}:${label}-color_picker`, {
		onChange() {
			const color = colorPicker.get() as tinycolor.Instance
			$value = color.toHexString()
		},
	})

	function mountColorPicker(el: HTMLDivElement) {
		colorPicker.toElement(el)
		colorPicker.set($value)
	}

	function onReset() {
		$value = defaultValue
	}

	const unsub = value.subscribe(v => {
		colorPicker.set(v)
	})

	onDestroy(() => {
		unsub()
		colorPicker.delete()
	})
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<div use:mountColorPicker />
	</div>
</BaseDialogItem>
