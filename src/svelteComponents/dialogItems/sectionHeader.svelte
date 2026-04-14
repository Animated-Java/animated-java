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
		padding: 6px 24px;
		font-size: 24px;
		border-bottom: 5px solid var(--color-back);
		background-color: var(--color-button);
		font-family: 'MinecraftFull';
	}
</style>
