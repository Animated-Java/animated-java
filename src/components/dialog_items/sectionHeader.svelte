<script lang="ts">
	export let label: string
</script>

<div class="dialog_bar form_bar animated-java-section-header">
	<h3 class="name_space_left">{label}</h3>
</div>

<style>
	.animated-java-section-header {
		display: flex;
		justify-content: flex-start;
		align-items: center;
	}
	h3 {
		background-color: var(--color-button);
		padding: 0px 8px;
		flex-grow: 2;
	}
</style>
