<script lang="ts" module>
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
</script>

<script lang="ts">
	interface Props {
		label: string
		description?: string
		options: Record<string, string>
		value: string
		onchange?: (newValue: string) => void
	}

	let { label, description, options, value = $bindable(), onchange }: Props = $props()

	const SELECT_ELEMENT = new Interface.CustomElements.SelectInput(
		`animated_java:select.${guid()}`,
		{
			options: (() => options)(),
			value: (() => value)(),
			onChange(newValue) {
				onchange?.(newValue)
				value = newValue
			},
		}
	)

	$effect(() => {
		SELECT_ELEMENT.set(value)
	})

	const mountSelect = (node: HTMLDivElement) => {
		node.appendChild(SELECT_ELEMENT.node)
	}
</script>

<BaseSidebarDialogItem {label} {description}>
	{#snippet inlineChildren()}
		<div class="fake-hr"></div>
		<div class="select" use:mountSelect></div>
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
	.select :global(.bb-select) {
		width: 100%;
	}
</style>
