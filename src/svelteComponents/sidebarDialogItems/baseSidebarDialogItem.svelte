<script lang="ts" module>
	import type { Snippet } from 'svelte'
</script>

<script lang="ts">
	import { slide } from 'svelte/transition'

	type ChildProps = [string]

	interface Props {
		label?: string
		description?: string
		required?: boolean
		inlineChildren?: Snippet<ChildProps>
		children?: Snippet<ChildProps>
		error?: string
		warning?: string
	}

	let {
		label,
		description,
		required,
		inlineChildren,
		children,
		error = $bindable(),
		warning = $bindable(),
	}: Props = $props()

	const ID = guid()
</script>

<div class="base-sidebar-dialog-item">
	<div class="inline-container">
		<div class="label">
			{#if label}
				<label for={ID}>
					{label}
					{#if required}
						<span class="required-asterisk">*</span>
					{/if}
				</label>
			{/if}
		</div>
		<div class="inline-slot-container">
			{@render inlineChildren?.(ID)}
		</div>
	</div>
	{#if description}
		<p class="description">{@html description}</p>
	{/if}
	<div class="slot-container">
		{@render children?.(ID)}
	</div>
	{#if error}
		<div class="popup error" transition:slide={{ duration: 100 }}>
			<i class="fa fa-circle-exclamation text_icon"></i>{@html error}
		</div>
	{:else if warning}
		<div class="popup warning" transition:slide={{ duration: 100 }}>
			<i class="fa fa-triangle-exclamation text_icon"></i>{@html warning}
		</div>
	{/if}
</div>

<style>
	.base-sidebar-dialog-item {
		margin-bottom: 24px;
	}

	.slot-container {
		position: relative;
	}

	.inline-container {
		display: flex;
		flex-direction: row;
		gap: 4px;
		align-items: center;
	}
	.inline-slot-container {
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		flex-grow: 1;
	}

	.label {
		font-size: 1.2em;
	}

	.required-asterisk {
		color: var(--color-accent);
	}

	.description {
		color: var(--color-subtle_text);
		font-size: 0.95em;
		margin-bottom: 8px;
	}

	.popup {
		position: relative;
		z-index: -1;

		display: flex;
		gap: 8px;
		flex-direction: row;
		align-items: center;
		font-size: 1em;
		padding: 8px 10px;
		border-radius: 0px 0px 8px 8px;
	}

	.popup i {
		font-size: 2em;
	}

	.error {
		color: var(--color-error);
		background: var(--color-elevated);
	}

	.warning {
		color: var(--color-warning);
		background: var(--color-elevated);
	}
</style>
