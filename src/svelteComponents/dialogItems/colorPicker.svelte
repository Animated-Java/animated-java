<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import { PACKAGE } from '../../constants'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		defaultValue?: string
		value: Observable<string>
	}

	let { label, tooltip = '', defaultValue = '#ffffff', value = $bindable() }: Props = $props()

	let colorPicker: ColorPicker

	$effect.pre(() => {
		colorPicker = new ColorPicker(`${PACKAGE.name}:${label}-color_picker`, {
			onChange() {
				const color = colorPicker.get() as tinycolor.Instance
				$value = color.toHexString()
			},
		})

		const unsub = value.subscribe(v => {
			colorPicker.set(v)
		})

		return () => {
			unsub()
			colorPicker.delete()
		}
	})

	function mountColorPicker(el: HTMLDivElement) {
		colorPicker.toElement(el)
		colorPicker.set($value)
	}

	function onReset() {
		$value = defaultValue
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset}>
	{#snippet children({ id })}
		<div class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<div use:mountColorPicker></div>
		</div>
	{/snippet}
</BaseDialogItem>
