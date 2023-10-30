<script lang="ts">
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: string
	export let valueValidator: ((value: string) => string) | undefined = undefined

	let _value: string = valueValidator ? valueValidator(value) : value

	function onValueChange(e: Event) {
		if (valueValidator) {
			_value = valueValidator(_value)
		}
		value = _value
	}
</script>

<BaseDialogItem {tooltip}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="name">{label}</label>
		<input
			type="text"
			class="dark_bordered half focusable_input"
			id="name"
			bind:value={_value}
			on:change={onValueChange}
		/>
	</div>
</BaseDialogItem>
