<script lang="ts">
	export let handleClick: (event: any) => void
	export let hovered: boolean
</script>

<button
	class="help-button"
	on:click={handleClick}
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
>
	<span class="material-icons" style="margin:0px">question_mark</span>
</button>

<style>
	button.help-button {
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

	button.help-button:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>
