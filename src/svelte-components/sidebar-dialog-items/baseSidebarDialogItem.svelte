<script lang="ts">
	import { slide } from 'svelte/transition'

	export let label = ''
	export let description = ''
	export let required = false
	export let warning = ''
	export let error = ''

	const ID = guid()
</script>

<div class="dialog-container">
	<div class="before">
		<slot name="before" />
		<div class="label">
			{#if label}
				<div class="header">
					<h3>
						{@html label}
						{#if required}
							<span>*</span>
						{/if}
					</h3>
				</div>
			{/if}
			{#if description}
				<p>{@html description}</p>
			{/if}
		</div>
	</div>

	<slot id={ID} />
</div>

{#if error}
	<div class="message error" transition:slide|local={{ duration: 100, axis: 'y' }}>
		<i class="fa fa-exclamation-circle text_icon" />
		{@html error}
	</div>
{:else if warning}
	<div class="message warning" transition:slide|local={{ duration: 100, axis: 'y' }}>
		<i class="fa fa-exclamation-triangle text_icon" />
		{@html error}
	</div>
{/if}

<!-- <hr /> -->
<div class="spacer" />

<style>
	.header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	.dialog-container {
		background-color: var(--color-ui);
		padding: 8px;
		padding-bottom: 0px;
	}
	.dialog-container:has(.docs-link:hover) {
		background-color: var(--color-button);
	}
	p {
		color: var(--color-subtle_text);
		padding-bottom: 8px;
	}
	.message {
		background-color: var(--color-button);
		padding: 4px 8px;
		/* margin-top: 2px; */
		border-radius: 0px 0px 4px 4px;
		width: calc(100% - 16px);
		margin-left: 8px;
	}
	.error {
		color: var(--color-error);
	}
	.warning {
		color: var(--color-warning);
	}

	h3 {
		margin: 0px;
		margin-bottom: -4px;
		margin-top: -8px;
	}
	i {
		align-content: center;
		text-align: center;
		margin-right: 4px;
	}
	span {
		color: var(--color-accent);
	}
	.spacer {
		height: 20px;
	}
	.before {
		display: flex;
		align-items: center;
		flex-direction: row;
	}
	.label {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.dialog-container :global(code) {
		border-radius: 4px;
		padding: 0px 4px;
		font-size: 14px;
		display: inline-masonry;
	}
</style>
