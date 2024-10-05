<script lang="ts">
	import { slide } from 'svelte/transition'
	import { markdownToHTML } from '../../util/misc'

	export let label: string = ''
	export let description: string = ''
	export let required: boolean = false
	export let warning: string = ''
	export let error: string = ''

	let id = guid()
</script>

<div class="dialog-container">
	<div class="before">
		<slot name="before" />
		<div class="label">
			{#if label}
				<div class="header">
					<h3>
						{label}
						{#if required}
							<span>*</span>
						{/if}
					</h3>
				</div>
			{/if}
			{#if description}
				<p>{@html markdownToHTML(description)}</p>
			{/if}
		</div>
	</div>

	<slot {id} />
</div>

{#if error}
	<div class="message error" transition:slide|local={{ duration: 100, axis: 'y' }}>
		<i class="fa fa-exclamation-circle text_icon" />
		{@html markdownToHTML(error)}
	</div>
{:else if warning}
	<div class="message warning" transition:slide|local={{ duration: 100, axis: 'y' }}>
		<i class="fa fa-exclamation-triangle text_icon" />
		{@html markdownToHTML(warning)}
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
		margin-top: 2px;
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
</style>
