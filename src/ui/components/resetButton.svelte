<script lang="ts">
	import type * as Settings from '../../settings'
	export let onClick: () => void
</script>

<button class="reset-button" on:click={onClick}>
	<span class="material-icons" style="margin:0px">delete</span>
</button>

<style>
	button.reset-button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;

		background-color: var(--color-button) !important;
		height: 34px !important;
		width: 34px !important;
		line-height: 10px !important;
		font-size: 20px !important;
		margin-left: 10px !important;
	}

	button.reset-button:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>
