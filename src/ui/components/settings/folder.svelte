<script lang="ts">
	import SettingContainer from '../settingContainer.svelte'
	import type * as AJ from '../../../settings'

	export let setting: AJ.FolderSetting

	// @ts-ignore
	let dialog = electron.dialog

	function selectFolder() {
		dialog
			.showOpenDialog({
				promptToCreate: true,
				properties: ['openDirectory'],
			})
			.then((result: any) => {
				// console.log(result)
				if (!result.canceled) {
					setting.value = result.filePaths[0]
				}
			})
	}
</script>

<SettingContainer {setting}>
	<div slot="inline" class="container">
		<input type="text" class="text_inline" bind:value={setting.value} title={setting.value} />
		<button class="open-folder-button" on:click={selectFolder}>
			<span class="material-icons">folder</span>
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

	button.open-folder-button {
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

	button.open-folder-button:hover {
		color: var(--color-accent_text) !important;
		background-color: var(--color-accent) !important;
	}
</style>
