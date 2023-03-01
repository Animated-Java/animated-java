<script lang="ts">
	import PrismEditor from '../prism/prismEditor.svelte'

	export let value: string
	export let language: string
</script>

<div class="prism-wrapper">
	<PrismEditor {language} bind:code={value} />
</div>

<style>
	div.prism-wrapper {
		font-family: var(--font-code);
		flex-grow: 1;
		margin-top: 10px;
		background-color: var(--color-button);
	}
</style>
