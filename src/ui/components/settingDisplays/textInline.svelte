<script lang="ts">
	export let value: string
</script>

<input type="text" class="text_inline" bind:value />

<style>
	.text_inline {
		background: var(--color-button);
		font-family: var(--font-code);
		flex-grow: 1;
		padding: 5px;
		padding-left: 11px;
		padding-right: 11px;
	}
</style>
