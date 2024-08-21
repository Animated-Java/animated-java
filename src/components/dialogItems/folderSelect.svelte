<script lang="ts">
	import type { FileFilter } from 'electron'
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: Valuable<string>
	export let defaultValue: string
	export let filters: FileFilter[] = []
	export let fileSelectMessage: string = 'Select Folder'

	let _value: string = value.get()

	export let valueChecker: DialogItemValueChecker<string> = undefined

	let warning_text = ''
	let error_text = ''

	function checkValue() {
		if (!valueChecker) return
		const result = valueChecker(value.get())
		result.type === 'error' ? (error_text = result.message) : (error_text = '')
		result.type === 'warning' ? (warning_text = result.message) : (warning_text = '')
	}
	value.subscribe(() => checkValue())

	function onValueChange() {
		value.set(_value)
		_value = value.get()
	}

	function selectFile() {
		Promise.any([
			// @ts-ignore
			electron.dialog.showOpenDialog({
				properties: ['openDirectory'],
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

<BaseDialogItem {label} {tooltip} {onReset} bind:warning_text bind:error_text let:id>
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
