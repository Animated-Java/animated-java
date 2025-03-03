<script lang="ts">
	import { Syncable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''
	export let value: Syncable<string>
	export let defaultValue: string
	export let disabled = false
	export let valueChecker: DialogItemValueChecker<string> = undefined

	let _value: string = value.get()

	let warningText = ''
	let errorText = ''

	function onValueChange() {
		if (valueChecker) {
			const result = valueChecker(_value)
			result.type === 'error' ? (errorText = result.message) : (errorText = '')
			result.type === 'warning' ? (warningText = result.message) : (warningText = '')
		}

		value.set(_value)
		_value = value.get()
	}

	function onReset() {
		_value = defaultValue
		onValueChange()
	}

	onValueChange()
</script>

<BaseDialogItem {label} {tooltip} {warningText} {errorText} {onReset} let:id>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<input
			type="text"
			class="dark_bordered half focusable_input"
			{id}
			bind:value={_value}
			on:change={onValueChange}
			{disabled}
			style={disabled ? 'color: var(--color-subtle_text);' : ''}
		/>
	</div>
</BaseDialogItem>

<style>
	input {
		font-family: var(--font-code);
	}
</style>
