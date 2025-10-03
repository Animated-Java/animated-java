<script lang="ts">
	import { blueprintSettingErrors } from '../../formats/blueprint/settings'
	import { translate } from '../../util/translation'

	export let label: string
	export let tooltip: string = ''
	export let warning_text: string = ''
	export let error_text: string = ''
	export let onReset: () => void

	let id = guid()

	$: if (error_text) {
		blueprintSettingErrors.get()[label] = error_text
	}
</script>

<div class="dialog_item_container">
	<div class="base_dialog_item">
		<div class="slot_container">
			<slot {id} />

			<div class="description">
				{#if error_text}
					<div class="error_text">
						<i class="fa fa-exclamation-circle dialog_form_error text_icon" />
						<div class="error_lines">
							<!-- svelte-ignore missing-declaration -->
							{@html pureMarked(error_text)}
						</div>
					</div>
				{:else if warning_text}
					<div class="warning_text">
						<i class="fa fa-exclamation-triangle dialog_form_warning text_icon" />
						<!-- svelte-ignore missing-declaration -->
						{@html pureMarked(warning_text)}
					</div>
				{/if}
				{#if tooltip}
					<!-- svelte-ignore missing-declaration -->
					{@html pureMarked(tooltip)}
				{/if}
			</div>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i
			on:click={onReset}
			class="fa fa-rotate-left dialog_form_description dialog-form-description reset-button"
			title={translate('dialog.reset')}
		/>
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
