<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let checked: Valuable<boolean>
</script>

<BaseDialogItem {tooltip}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="export">{label}</label>
		<div class="spacer" />
		<input type="checkbox" class="focusable_input" id="export" bind:checked={$checked} />
	</div>
</BaseDialogItem>

<style>
	.spacer {
		flex-grow: 1;
	}
</style>
