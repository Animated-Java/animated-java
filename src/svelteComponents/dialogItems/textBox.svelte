<script lang="ts">
	import BaseDialogItem from './baseDialogItem.svelte'

	interface Props {
		label: string
		text: string
	}

	let { label, text }: Props = $props()
</script>

<BaseDialogItem>
	{#snippet children({ id })}
		<div class="dialog_bar form_bar bar">
			<label class="name_space_left" for={id}>{label}</label>
			<p>{@html text}</p>
		</div>
	{/snippet}
</BaseDialogItem>

<style>
	.bar {
		align-items: flex-start;
		flex-direction: column;
	}
	p {
		margin: 0;
		padding: 6px 24px;
		font-size: 16px;
		color: var(--color-subtle_text);
	}
</style>
