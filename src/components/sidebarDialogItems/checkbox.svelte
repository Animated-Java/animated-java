<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseSidebarDialogItem from './baseSidebarDialogItem.svelte'
	export let label: string
	export let description: string
	export let checked: Valuable<boolean>
</script>

<BaseSidebarDialogItem {label} {description}>
	<div class="input-container" slot="before">
		<input type="checkbox" bind:checked={$checked} />
	</div>
</BaseSidebarDialogItem>

<style>
	.input-container {
		display: flex;
		flex-direction: column;
		position: relative;
	}
	input {
		flex: 1;
		border: 0px;
		margin-right: 1.5em;
		margin-left: 1em;
		transition: border 0.1s cubic-bezier(0.25, 0.68, 0.53, 1.3);
	}
	input:before {
		font-size: 1.75em !important;
	}
</style>
