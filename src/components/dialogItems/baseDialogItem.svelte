<script lang="ts">
	import { blueprintSettingErrors } from '../../blueprintSettings'
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

<div>
	<div class="base_dialog_item">
		<div class="slot_container">
			<slot {id} />
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i
			on:click={onReset}
			class="fa fa-rotate-left dialog_form_description dialog-form-description reset-button"
			title={translate('dialog.reset')}
		/>
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
	{#if tooltip}
		<div class="description">
			<!-- svelte-ignore missing-declaration -->
			{@html pureMarked(tooltip)}
		</div>
	{/if}
</div>

<style>
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
	.description {
		font-size: 0.9em;
		color: var(--color-subtle_text);
		margin-top: 4px;
		margin-bottom: 16px;
		max-width: 80%;
	}
	.description :global(li) {
		list-style: circle;
		margin-left: 2em;
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
