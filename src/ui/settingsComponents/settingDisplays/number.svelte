<script lang="ts">
	export let value: number
	export let step: number | undefined
</script>

<input type="number" class="number" {step} bind:value />

<style>
	.number {
		border: none;
		background: var(--color-button);
		display: inline-block;
		text-align: center;
		vertical-align: middle;
		cursor: default;
		outline: none;
		height: 32px;
		min-width: 100px;
		width: auto;
		color: var(--color-text);
		padding-right: 16px;
		padding-left: 16px;
		font-weight: normal;
		cursor: pointer;
	}
</style>
