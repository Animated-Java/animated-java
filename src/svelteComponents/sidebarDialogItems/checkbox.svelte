<script lang="ts" module>
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
</script>

<script lang="ts">
	interface Props {
		label: string
		description?: string
		value: boolean
	}

	let { label, description, value = $bindable() }: Props = $props()
</script>

<BaseSidebarDialogItem {label} {description}>
	{#snippet inlineChildren(id)}
		<div class="fake-hr"></div>
		<input type="checkbox" {id} class="checkbox_input" bind:checked={value} />
	{/snippet}
</BaseSidebarDialogItem>

<style>
	.fake-hr {
		margin: 0px 8px;
		height: 0px;
		align-self: center;
		flex-grow: 1;
		border-top: 2px dashed var(--color-elevated);
	}
</style>
