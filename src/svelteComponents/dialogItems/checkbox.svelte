<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		tooltip?: string
		checked: Observable<boolean>
		defaultValue: boolean
	}

	let { label, tooltip = '', checked = $bindable(), defaultValue }: Props = $props()

	function onReset() {
		checked.set(defaultValue)
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset}>
	{#snippet children({ id })}
		<div class="dialog_bar form_bar checkbox_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<div class="checkbox-line">
				<div class="spacer"></div>
				<input type="checkbox" class="focusable_input" {id} bind:checked={$checked} />
			</div>
		</div>
	{/snippet}
</BaseDialogItem>

<style>
	.checkbox_bar {
		flex-direction: row;
	}
	.checkbox-line {
		display: flex;
		flex-direction: row;
		align-items: center;
		height: min-content;
		flex-grow: 1;
	}
	.spacer {
		flex-grow: 1;
		border-bottom: 2px dashed var(--color-button);
		height: 0px;
		margin: 8px;
		margin-left: 0px;
	}
</style>
