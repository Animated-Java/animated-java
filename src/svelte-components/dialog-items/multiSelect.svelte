<script lang="ts">
	import MultiSelect, { type ObjectOption } from 'svelte-multiselect'
	import { Syncable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import BaseDialogItem from './baseDialogItem.svelte'

	type StringOption = ObjectOption & { value: string }

	export let label: string
	export let tooltip = ''
	export let options: StringOption[]
	export let defaultValue: StringOption[]
	export let value: Syncable<string[]>

	let selected: StringOption[] = $value
		.filter(v => options.find(o => o.value == v))
		.map(v => options.find(o => o.value == v)!)

	let warningText = ''

	if (selected.length === 0) {
		selected = defaultValue
	}

	value.subscribe(v => {
		selected = options.filter(o => v.includes(o.value))
	})

	$: {
		value.set(selected.map(v => v.value))
		// FIXME - This warning is unique to the targeted minecraft version setting.
		// Since the only use of this component is in the targeted minecraft version setting, this is fine... for now.
		if (selected.length > 1) {
			warningText = translate(
				'dialog.blueprint_settings.target_minecraft_versions.warning.multiple_versions'
			)
		} else {
			warningText = ''
		}
	}

	function sortByIndex(a: StringOption, b: StringOption) {
		return options.indexOf(a) - options.indexOf(b)
	}

	function onReset() {
		value.set(defaultValue.map(v => v.value))
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id {warningText}>
	<div class="dialog_bar form_bar multi-select-container">
		<label class="name_space_left" for={id}>{label}</label>
		<MultiSelect
			{options}
			bind:selected
			minSelect={1}
			inputmode="none"
			inputStyle="display: none;"
			selectedOptionsDraggable={false}
			sortSelected={sortByIndex}
		>
			<div slot="option" let:option title={option.title}>
				<i class="fa-solid fa-plus"></i>
				{option.label}
			</div>
		</MultiSelect>
	</div>
</BaseDialogItem>

<style>
	.multi-select-container :global(div.multiselect) {
		width: 100%;
		background-color: var(--color-back);
		border: 1px solid var(--color-border);
		border-radius: 0px;
		padding: 8px 4px;
	}

	.multi-select-container :global(div.multiselect > ul.selected > li) {
		border: unset;
		background-color: var(--color-button);
		border-radius: 0px;
		padding: 2px 8px;
	}

	.multi-select-container :global(div.multiselect > ul.options) {
		/* dropdown options */
		border-radius: 0px;
	}

	.multi-select-container :global(div.multiselect > ul.options > li) {
		/* dropdown list items */
		color: var(--color-bright_ui_text);
		background-color: var(--color-bright_ui);
		padding: 4px 8px;
		& div {
			gap: 8px;
			display: flex;
			align-items: center;
		}
	}

	/* .multi-select-container :global(div.multiselect > ul.options > li.selected) {
	} */

	.multi-select-container :global(div.multiselect > ul.options > li:not(.selected):hover) {
		/* unselected but hovered options in the dropdown list */
		color: var(--color-accent_text);
		background-color: var(--color-accent);
	}

	.multi-select-container :global(div.multiselect > ul.selected > li button) {
		/* buttons to remove a single or all selected options at once */
		width: 16px;
		min-width: 16px;
		height: 16px;
		border-radius: 0px;
		background-color: var(--color-button);
	}

	.multi-select-container :global(div.multiselect > ul.selected > li button svg) {
		/* buttons to remove a single or all selected options at once */
		width: 16px;
		min-width: 16px;
		height: 16px;
	}

	.multi-select-container :global(div.multiselect > ul.selected > li button:hover) {
		/* buttons to remove a single or all selected options at once */
		background-color: var(--color-accent);
		background-color: var(--color-close);
	}

	.multi-select-container :global(button.remove-all) {
		/* buttons to remove a single or all selected options at once */
		display: none;
	}
</style>
