<script lang="ts">
	import SettingContainer from '../settingContainer.svelte'
	import type * as AJ from '../../../settings'

	export let setting: AJ.FileSetting

	// @ts-ignore
	let dialog = electron.dialog

	function selectFile() {
		dialog
			.showSaveDialog({
				promptToCreate: true,
				properties: ['openFile'],
			})
			.then((result: any) => {
				// console.log(result)
				if (!result.canceled) {
					setting.value = result.filePath
				}
			})
	}
</script>

<SettingContainer {setting}>
	<div slot="inline" class="container">
		<input type="text" class="text_inline" bind:value={setting.value} title={setting.value} />
		<button class="open-file-button" on:click={selectFile}>
			<span class="material-icons">insert_drive_file</span>
		</button>
	</div>
</SettingContainer>

<style>
	div.container {
		display: flex;
		flex-grow: 1;
	}

	.text_inline {
		background: var(--color-button);
		font-family: var(--font-code);
		flex-grow: 1;
		padding: 5px;
		padding-left: 11px;
		padding-right: 11px;
		height: unset;
	}

	button.open-file-button {
		all: unset !important;

		display: flex !important;
		justify-content: center !important;
		align-content: center !important;
		flex-wrap: wrap !important;

		background-color: var(--color-button) !important;
		height: 34px !important;
		width: 34px !important;
		line-height: 10px !important;
		font-size: 20px !important;
		margin-left: 10px !important;
	}

	button.open-file-button:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>
