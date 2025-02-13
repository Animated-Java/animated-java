<script lang="ts">
	export let label: string
</script>

<div class="dialog_bar form_bar animated-java-section-header">
	<h4 class="name_space_left">{label}</h4>
</div>

<style>
	.animated-java-section-header {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
	}
	h4 {
		padding: 0px 8px;
		flex-grow: 1;
		font-size: 1.12em;
		border-bottom: 2px solid var(--color-back);
		background-color: var(--color-button);
	}
</style>
