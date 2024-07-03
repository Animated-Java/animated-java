<script lang="ts" context="module">
	import { blueprintSettingErrors } from '../../blueprintSettings'
</script>

<script lang="ts">
	export let label: string
	export let tooltip: string = ''
	export let warning_text: string = ''
	export let error_text: string = ''

	$: if (error_text) {
		blueprintSettingErrors.get()[label] = error_text
	}

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
		<i
			class="fa fa-question dialog_form_description dialog-form-description"
			on:click={onQuestionMarkClick}
		/>
	{:else}
		<i
			class="fa fa-question dialog_form_description dialog-form-description"
			style="visibility: hidden"
		/>
	{/if}
</div>
<div class="base_dialog_item">
	{#if error_text}
		<div class="error_text">
			<i class="fa fa-exclamation-circle dialog_form_error text_icon" />
			<div class="error_lines">
				{#each error_text.split('\n') as text}
					<div>{text}</div>
				{/each}
			</div>
		</div>
	{:else if warning_text}
		<div class="warning_text">
			<i class="fa fa-exclamation-triangle dialog_form_warning text_icon" />
			<div class="warning_lines">
				{#each warning_text.split('\n') as text}
					<div>{text}</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.base_dialog_item {
		display: flex;
		flex-direction: row;
		/* align-items: center; */
		justify-content: space-between;
	}
	.slot_container {
		flex-grow: 1;
	}
	.warning_text {
		display: flex;
		align-items: center;
		color: var(--color-warning);
		font-family: var(--font-code);
		font-size: 0.8em;
	}
	.warning_lines {
		display: flex;
		flex-direction: column;
	}
	.error_text {
		display: flex;
		align-items: center;
		color: var(--color-error);
		font-family: var(--font-code);
		font-size: 0.8em;
	}
	.error_lines {
		display: flex;
		flex-direction: column;
	}
	.text_icon {
		margin-right: 8px;
	}
	.dialog-form-description {
		padding-top: 12px;
	}
</style>
