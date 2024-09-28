<script lang="ts">
	import { slide } from 'svelte/transition'
	import { markdownToHTML } from '../../util/misc'

	export let label: string
	export let required: boolean = false
	export let description: string
	export let warning: string = ''
	export let error: string = ''
</script>

<div class="before">
	<slot name="before" />
	<div class="label">
		<h3>
			{label}
			{#if required}
				<span>*</span>
			{/if}
		</h3>
		<p>{description}</p>
	</div>
</div>

<slot />

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
	p {
		color: var(--color-subtle_text);
		padding-bottom: 8px;
	}
	.message {
		background-color: var(--color-button);
		padding: 4px 8px;
		border-radius: 0px 0px 4px 4px;
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
