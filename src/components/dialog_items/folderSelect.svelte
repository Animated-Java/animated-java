<script lang="ts">
	import { Valuable } from '../../util/stores'
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: Valuable<string>
	export let filters: Array<{ name: string }> = []
	export let fileSelectMessage: string = 'Select Folder'

	let _value: string = value.get()

	export let valueChecker: ((value: string) => { type: string; message: string }) | undefined =
		undefined

	let warning_text = ''
	let error_text = ''

	function checkValue() {
		if (!valueChecker) return
		const result = valueChecker(value.get())
		switch (result.type) {
			case 'error':
				error_text = result.message
				warning_text = ''
				break
			case 'warning':
				warning_text = result.message
				error_text = ''
				break
			default:
				warning_text = ''
				error_text = ''
				break
		}
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
				console.log(result)
				_value = result.filePaths[0]
				onValueChange()
			}
		})
	}
</script>

<BaseDialogItem {tooltip} bind:warning_text bind:error_text>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="name">{label}</label>
		<input
			type="text"
			class="dark_bordered half focusable_input"
			id="name"
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
</style>
