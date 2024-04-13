<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: Valuable<string>
	export let disabled: boolean = false
	export let valueChecker: DialogItemValueChecker<string> = undefined

	let _value: string = value.get()

	let warning_text = ''
	let error_text = ''

	function onValueChange() {
		if (valueChecker) {
			const result = valueChecker(_value)
			result.type === 'error' ? (error_text = result.message) : (error_text = '')
			result.type === 'warning' ? (warning_text = result.message) : (warning_text = '')
		}

		console.log('onValueChange', _value)

		value.set(_value)
		_value = value.get()
	}
</script>

<BaseDialogItem {tooltip} {warning_text} {error_text}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="name">{label}</label>
		<textarea
			class="dark_bordered half focusable_input"
			id="name"
			bind:value={_value}
			on:change={onValueChange}
			{disabled}
			style={disabled ? 'color: var(--color-subtle_text);' : ''}
		/>
	</div>
</BaseDialogItem>

<style>
	textarea {
		resize: vertical;
		word-wrap: unset;
		min-height: 60px;
	}
</style>
