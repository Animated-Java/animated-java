<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		value: Observable<string>
		defaultValue: string
		disabled?: boolean
		valueChecker?: DialogItemValueChecker<string>
	}

	let {
		label,
		tooltip = '',
		value = $bindable(),
		defaultValue,
		disabled = false,
		valueChecker = undefined,
	}: Props = $props()

	let warningText = $state('')
	let errorText = $state('')

	const onValueChange = async () => {
		if (valueChecker) {
			const result = await valueChecker($value)
			result.type === 'error' ? (errorText = result.message) : (errorText = '')
			result.type === 'warning' ? (warningText = result.message) : (warningText = '')
		}
	}

	$effect.pre(() => {
		value.subscribe(onValueChange)
	})

	function onReset() {
		$value = defaultValue
	}
</script>

<BaseDialogItem {label} {tooltip} {warningText} {errorText} {onReset}>
	{#snippet children({ id })}
		<div class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<input
				type="text"
				class="dark_bordered half focusable_input"
				{id}
				bind:value={$value}
				onchange={onValueChange}
				{disabled}
				style={disabled ? 'color: var(--color-subtle_text);' : ''}
			/>
		</div>
	{/snippet}
</BaseDialogItem>

<style>
	input {
		font-family: var(--font-code);
	}
</style>
