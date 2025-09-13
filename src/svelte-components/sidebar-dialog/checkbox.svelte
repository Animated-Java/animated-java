<script lang="ts">
	import type { Syncable } from '@aj/util/stores'
	import SidebarDialogItem from './sidebarDialogItem.svelte'

	interface Props {
		label: string
		description?: string
		required?: boolean
		value: Syncable<boolean>
	}

	const { label, description, required, value = $bindable() }: Props = $props()
</script>

<SidebarDialogItem {label} {description} {required}>
	{#snippet inline(id)}
		<input type="checkbox" {id} bind:checked={$value} />
	{/snippet}
</SidebarDialogItem>

<style>
	input {
		flex-grow: 1;
		text-align: end;
	}
</style>
