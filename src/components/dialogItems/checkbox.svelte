<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let checked: Valuable<boolean>
	export let defaultValue: boolean

	function onReset() {
		checked.set(defaultValue)
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div class="dialog_bar form_bar checkbox_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<div class="checkbox-line">
			<div class="spacer" />
			<input type="checkbox" class="focusable_input" {id} bind:checked={$checked} />
		</div>
	</div>
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
