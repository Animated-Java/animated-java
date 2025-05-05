<script lang="ts">
	// import { blueprintSettingErrors } from '../../blueprintSettings'
	import { translate } from '../../util/translation'

	export let label: string
	export let tooltip = ''
	export let warningText = ''
	export let errorText = ''
	export let onReset: () => void

	const UUID = guid()

	$: if (errorText) {
		console.error(label, errorText)
		// blueprintSettingErrors.get()[label] = error_text
	}

	function onQuestionMarkClick() {
		Blockbench.showQuickMessage(tooltip, 50 * tooltip.length)
	}
</script>

<div>
	<div class="base_dialog_item" title={tooltip}>
		<div class="slot_container" style={tooltip ? 'margin-right: 4px' : ''}>
			<slot id={UUID} />
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
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i
			on:click={onReset}
			class="fa fa-trash-can dialog_form_description dialog-form-description reset-button"
			title={translate('dialog.reset')}
		/>
	</div>
	<div class="base_dialog_item">
		{#if errorText}
			<div class="error_text">
				<i class="fa fa-exclamation-circle dialog_form_error text_icon" />
				<div class="error_lines">
					{#each errorText.split('\n') as text}
						<div>{text}</div>
					{/each}
				</div>
			</div>
		{:else if warningText}
			<div class="warning_text">
				<i class="fa fa-exclamation-triangle dialog_form_warning text_icon" />
				<div class="warning_lines">
					{#each warningText.split('\n') as text}
						<div>{text}</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
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
	.reset-button {
		padding-top: 12px;
		margin-left: 4px;
	}
	.reset-button:hover {
		color: var(--color-error);
		transition: unset;
	}
</style>
