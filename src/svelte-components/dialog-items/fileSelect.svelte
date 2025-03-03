<script lang="ts">
	import type { FileFilter } from 'electron'
	import { Syncable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip = ''
	export let value: Syncable<string>
	export let defaultValue: string
	export let filters: FileFilter[] = []
	export let fileSelectMessage = 'Select File'

	let _value: string = value.get()

	export let valueChecker: DialogItemValueChecker<string> = undefined

	let warningText = ''
	let errorText = ''

	function checkValue() {
		if (!valueChecker) return
		const result = valueChecker(value.get())
		result.type === 'error' ? (errorText = result.message) : (errorText = '')
		result.type === 'warning' ? (warningText = result.message) : (warningText = '')
	}
	value.subscribe(() => checkValue())

	function onValueChange() {
		value.set(_value)
		_value = value.get()
	}

	function selectFile() {
		void Promise.any([
			// @ts-ignore
			electron.dialog.showOpenDialog({
				properties: ['openFile', 'promptToCreate'],
				filters,
				message: fileSelectMessage,
			}),
		]).then(result => {
			if (!result.canceled) {
				_value = result.filePaths[0]
				onValueChange()
			}
		})
	}

	function onReset() {
		_value = defaultValue
		onValueChange()
	}

	onValueChange()
</script>

<BaseDialogItem {label} {tooltip} {onReset} bind:warningText bind:errorText let:id>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for={id}>{label}</label>
		<input
			type="text"
			class="dark_bordered half focusable_input"
			{id}
			bind:value={_value}
			on:input={onValueChange}
			on:change={onValueChange}
		/>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="tool animated-java-file-select-icon" on:click={() => selectFile()}>
			<i class="material-icons icon">insert_drive_file</i>
		</div>
	</div>
</BaseDialogItem>

<style>
	.animated-java-file-select-icon {
		display: flex;
		justify-content: flex-end;
	}
	i {
		font-size: 20px;
		margin-right: 4px;
		color: var(--color-subtle_text);
		cursor: pointer;
	}
	i:hover {
		color: var(--color-text);
	}
	input {
		font-family: var(--font-code);
	}
</style>
