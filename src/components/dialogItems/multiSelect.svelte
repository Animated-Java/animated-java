<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let options: Record<string, string>
	export let defaultSelection: string[]
	export let selection: Valuable<boolean[]>

	function toggleOption(option: number) {
		selection.get()[option] = !selection.get()[option]
		selection.set(selection.get())
	}
</script>

<BaseDialogItem {label} {tooltip} let:id>
	<div class="dialog_bar form_bar checkbox_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<div class="spacer" />
		<div>
			{#each $selection as value, i}
				<input type="checkbox" class="focusable_input" {id} bind:checked={value} />
			{/each}
		</div>
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
