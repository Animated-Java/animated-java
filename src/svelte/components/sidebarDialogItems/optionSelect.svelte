<script lang="ts">
	import { Valuable } from '../../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	export let label: string
	export let description: string
	export let selected: Valuable<any>
	export let options: Record<any, string>
	export let required: boolean = false

	let customElementContainer: HTMLElement

	// @ts-expect-error
	const select = new Interface.CustomElements.SelectInput(`${guid()}-select`, {
		options,
		value: $selected,
		onChange: value => {
			console.log(value)
			$selected = value
		},
	})
	requestAnimationFrame(() => {
		customElementContainer.appendChild(select.node)
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
	/* input {
		flex: 1;
		border: 0px;
		margin-right: 1.5em;
		margin-left: 1em;
		transition: border 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	} */
	/* input:before {
		font-size: 1.75em !important;
	} */
</style>
