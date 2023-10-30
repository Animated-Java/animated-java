<script lang="ts">
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let checked: boolean
</script>

<BaseDialogItem {tooltip}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="export">{label}</label>
		<input type="checkbox" class="focusable_input" id="export" bind:checked />
	</div>
</BaseDialogItem>
