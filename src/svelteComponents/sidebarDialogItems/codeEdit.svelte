<script lang="ts" module>
	import CustomCodeJar from '../customCodeJar.svelte'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
</script>

<script lang="ts">
	interface Props {
		label: string
		description?: string
		value: string
		syntax?: string
		required?: boolean
	}

	let { label, description, value = $bindable(), syntax, required }: Props = $props()

	let error = $state<string | undefined>()
	let warning = $state<string | undefined>()
</script>

<BaseSidebarDialogItem {label} {description} {required} {error} {warning}>
	{#snippet children(id)}
		<div {id} class="codejar-container {error ? 'error' : ''} {warning ? 'warning' : ''}">
			<CustomCodeJar {syntax} bind:value></CustomCodeJar>
		</div>
	{/snippet}
</BaseSidebarDialogItem>

<style>
	.codejar-container {
		border-radius: 0;
		transition: outline 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
		width: 680px;
	}

	.error {
		outline: 2px solid var(--color-error);
	}

	.warning {
		outline: 2px solid var(--color-warning);
	}
</style>
