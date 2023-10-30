<script lang="ts">
	export let tooltip: string = ''

	function onQuestionMarkClick() {
		Blockbench.showQuickMessage(tooltip, 50 * tooltip.length)
	}
</script>

<div class="base_dialog_item" title={tooltip}>
	<div class="slot_container" style={tooltip ? 'margin-right: 4px' : ''}>
		<slot />
	</div>
	{#if tooltip}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i class="fa fa-question dialog_form_description" on:click={onQuestionMarkClick} />
	{/if}
</div>

<style>
	.base_dialog_item {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	.slot_container {
		flex-grow: 1;
	}
</style>
