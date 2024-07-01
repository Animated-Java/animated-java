<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let checked: Valuable<boolean>
</script>

<BaseDialogItem {label} {tooltip}>
	<div class="dialog_bar form_bar checkbox_bar">
		<label class="name_space_left" for="export">{label}</label>
		<div class="spacer" />
		<input type="checkbox" class="focusable_input" id="export" bind:checked={$checked} />
	</div>
</BaseDialogItem>

<style>
	.checkbox_bar {
		flex-direction: row;
		align-items: center;
	}
	.spacer {
		flex-grow: 1;
		border-bottom: 2px dashed var(--color-button);
		height: 0px;
		margin: 8px;
		margin-left: 16px;
	}
	label {
		width: auto;
	}
</style>
