<script lang="ts">
	import type { Valuable } from '../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	export let label: string
	export let description: string
	export let selected: Valuable<any>
	export let options: Record<any, string>
	export let required = false

	let customElementContainer: HTMLElement

	const SELECT = new Interface.CustomElements.SelectInput(`${guid()}-select`, {
		options,
		value: $selected,
		onChange: value => {
			$selected = value
		},
	})
	requestAnimationFrame(() => {
		customElementContainer.appendChild(SELECT.node)
	})
</script>

<BaseSidebarDialogItem {label} {required} {description}>
	<div class="container" bind:this={customElementContainer}></div>
</BaseSidebarDialogItem>

<style>
	.container {
		display: flex;
		flex-direction: column;
		position: relative;
	}
</style>
