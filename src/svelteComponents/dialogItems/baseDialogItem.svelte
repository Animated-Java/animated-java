<script lang="ts">
	import { blueprintSettingErrors } from '../../formats/blueprint/settings'
	import { localize as translate } from '../../util/lang'

	interface Props {
		label: string
		tooltip?: string
		warningText?: string
		errorText?: string
		onReset: () => void
		children?: import('svelte').Snippet<[any]>
	}

	let {
		label,
		tooltip = '',
		warningText = $bindable(''),
		errorText = $bindable(''),
		onReset,
		children,
	}: Props = $props()

	let id = guid()

	$effect.pre(() => {
		if (errorText) {
			blueprintSettingErrors.get()[label] = errorText
		}
	})
</script>

<div class="dialog_item_container">
	<div class="base_dialog_item">
		<div class="slot_container">
			{@render children?.({ id })}

			<div class="description">
				{#if errorText}
					<div class="error_text">
						<i class="fa fa-exclamation-circle dialog_form_error text_icon"></i>
						<div class="error_lines">
							{@html pureMarked(errorText)}
						</div>
					</div>
				{:else if warningText}
					<div class="warning_text">
						<i class="fa fa-exclamation-triangle dialog_form_warning text_icon"></i>

						{@html pureMarked(warningText)}
					</div>
				{/if}
				{#if tooltip}
					{@html pureMarked(tooltip)}
				{/if}
			</div>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<i
			onclick={onReset}
			class="fa fa-rotate-left dialog_form_description dialog-form-description reset-button"
			title={translate('dialog.reset')}
		></i>
	</div>
</div>

<style>
	.dialog_item_container {
		margin: 0px 16px 8px;
	}
	.base_dialog_item {
		display: flex;
		flex-direction: row;
	}
	.base_dialog_item :global(label) {
		--max_label_width: 200px !important;
	}
	.slot_container {
		flex-grow: 1;
		margin-right: 4px;
		max-width: 96%;
	}
	.warning_text i {
		font-size: 1.2em;
	}
	.warning_text {
		display: flex;
		align-items: center;
		color: var(--color-warning);
		font-family: var(--font-code);
		margin: 0.75rem;
		margin-top: 0;
	}
	.description {
		font-size: 0.9rem;
		color: var(--color-subtle_text);
		margin: 0 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.description :global(li) {
		list-style: circle;
		margin-left: 1.5rem;
	}
	.error_text i {
		font-size: 1.2em;
	}
	.error_text {
		display: flex;
		align-items: center;
		color: var(--color-error);
		font-family: var(--font-code);
		margin: 0.75rem;
		margin-top: 0;
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
