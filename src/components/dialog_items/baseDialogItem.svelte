<script lang="ts">
	export let tooltip: string = ''
	export let warning_text: string = ''
	export let error_text: string = ''

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
<div class="base_dialog_item">
	{#if error_text}
		<div class="error_text">
			<i class="fa fa-exclamation-circle dialog_form_error text_icon" />{error_text}
		</div>
	{:else if warning_text}
		<div class="warning_text">
			<i class="fa fa-exclamation-triangle dialog_form_warning text_icon" />{warning_text}
		</div>
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
	.warning_text {
		color: var(--color-warning);
		font-family: var(--font-code);
		font-size: 0.8em;
	}
	.error_text {
		color: var(--color-error);
		font-family: var(--font-code);
		font-size: 0.8em;
	}
	.text_icon {
		margin-right: 8px;
	}
</style>
