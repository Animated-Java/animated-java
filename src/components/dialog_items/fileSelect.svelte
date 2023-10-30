<script lang="ts">
	import BaseDialogItem from './baseDialogItem.svelte'

	export let label: string
	export let tooltip: string = ''
	export let value: string
	export let valueValidator: ((value: string) => string) | undefined = undefined
	export let filters: Array<{ name: string; extension: string }> = []
	export let fileSelectMessage: string = 'Select File'

	let _value: string = valueValidator ? valueValidator(value) : value

	function onValueChange(e: Event) {
		if (valueValidator) {
			_value = valueValidator(_value)
		}
		value = _value
	}

	function selectFile() {
		Promise.any([
			// @ts-ignore
			electron.dialog.showOpenDialog({
				properties: ['openFile'],
				filters,
				message: fileSelectMessage,
			}),
		]).then(result => {
			if (!result.canceled) {
				console.log(result)
				_value = result.filePaths[0]
			}
		})
	}
</script>

<BaseDialogItem {tooltip}>
	<div class="dialog_bar form_bar">
		<label class="name_space_left" for="name">{label}</label>
		<input
			type="text"
			class="dark_bordered half focusable_input"
			id="name"
			bind:value={_value}
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
