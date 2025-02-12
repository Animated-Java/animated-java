<script lang="ts">
	import type { Valuable } from '../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	export let label: string
	export let description: string
	export let value: Valuable<string>
	export let required = false
	export let defaultValue = ''
	export let placeholder = ''
	export let valueChecker: DialogItemValueChecker<string> = undefined
	export let disabled = false

	let warning = ''
	let error = ''

	let alertBorder = ''

	$: {
		if (error) {
			alertBorder = 'error-border'
		} else if (warning) {
			alertBorder = 'warning-border'
		} else {
			alertBorder = ''
		}
	}

	$: {
		if (valueChecker) {
			const result = valueChecker($value)
			result.type === 'warning' ? (warning = result.message) : (warning = '')
			result.type === 'error' ? (error = result.message) : (error = '')
		}
	}
</script>

<BaseSidebarDialogItem {label} {required} {description} {warning} {error}>
	<div class="input-container">
		<input
			type="text"
			class="dark_bordered {alertBorder}"
			{placeholder}
			bind:value={$value}
			{disabled}
		/>
		{#if !disabled && defaultValue !== '' && $value !== defaultValue}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<i
				class="fa fa-arrow-rotate-left text_icon reset-button"
				on:click={() => ($value = defaultValue)}
			/>
		{/if}
	</div>
</BaseSidebarDialogItem>

<style>
	.input-container {
		display: flex;
		flex-direction: row;
		width: 100%;
		position: relative;
		z-index: 1;
	}
	input {
		flex: 1;
		outline: 0px solid var(--color-back);
		transition: outline 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}
	i {
		align-content: center;
		text-align: center;
		width: 32px;
	}
	.reset-button {
		cursor: pointer;
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
	}
	.reset-button:hover {
		color: var(--color-light);
	}
	.error-border {
		outline: 2px solid var(--color-error);
	}
	.warning-border {
		outline: 2px solid var(--color-warning);
	}
</style>
