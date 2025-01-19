<script lang="ts">
	import BoxSelect from '../../components/sidebarDialogItems/boxSelect.svelte'
	import Checkbox from '../../components/sidebarDialogItems/checkbox.svelte'
	import FileSelect from '../../components/sidebarDialogItems/fileSelect.svelte'
	import FolderSelect from '../../components/sidebarDialogItems/folderSelect.svelte'
	import type { ValuableBlueprintSettings } from '../'
	import { directoryExists, fileExists, resolvePath } from '../../../util/fileUtil'
	import { translate } from '../../../util/translation'
	import LineEdit from '../../components/sidebarDialogItems/lineEdit.svelte'
	import { defaultValues } from '../../../blueprintSettings'
	export let settings: ValuableBlueprintSettings

	const resourcePackExportMode = settings.resource_pack_export_mode
	const targetMinecraftVersion = settings.target_minecraft_version

	const resourcePackFolderChecker: DialogItemValueChecker<string> = value => {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.resource_pack.error.folder_does_not_exist',
				),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.no_folder_selected',
					),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.folder_does_not_exist',
					),
				}
			case !fs.statSync(path).isDirectory():
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.not_a_folder',
					),
				}
			case !fileExists(PathModule.join(path, 'pack.mcmeta')):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.missing_pack_mcmeta',
					),
				}
			case !directoryExists(PathModule.join(path, 'assets')):
				return {
					type: 'warning',
					message: translate(
						'dialog.blueprint_settings.resource_pack.warning.missing_assets_folder',
					),
				}
			default:
				return { type: 'success', message: '' }
		}
	}

	const zipChecker: DialogItemValueChecker<string> = value => {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.data_pack_zip.error.file_does_not_exist',
				),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.data_pack_zip.error.no_file_selected',
					),
				}
			case fs.existsSync(path) && !fs.statSync(path).isFile():
				return {
					type: 'error',
					message: translate('dialog.blueprint_settings.data_pack_zip.error.not_a_file'),
				}
			default:
				return { type: 'success', message: '' }
		}
	}
</script>

<BoxSelect
	selected={resourcePackExportMode}
	options={{
		folder: {
			type: 'text',
			label: 'Export to Folder',
			description: 'Export the generated Resource Pack to a folder.',
		},
		zip: {
			type: 'text',
			label: 'Export to Zip',
			description: 'Export the generated Resource Pack to a zip file.',
		},
		none: {
			type: 'text',
			label: 'Do Not Export',
			description: 'Do not export a Resource Pack.',
		},
	}}
/>

{#if $resourcePackExportMode !== 'none'}
	{#if $resourcePackExportMode === 'folder'}
		<FolderSelect
			label="Export Folder"
			description="Choose the folder to export the Resource Pack to."
			value={settings.resource_pack}
			placeholder="Select a Folder"
			required
			valueChecker={resourcePackFolderChecker}
		/>
	{:else if $resourcePackExportMode === 'zip'}
		<FileSelect
			label="Export File"
			description="Choose the file to export the Resource Pack to."
			value={settings.resource_pack}
			placeholder="Select a File"
			required
			valueChecker={zipChecker}
		/>
	{/if}
{/if}

<!-- Don't show display item if the target version is 1.21.4 or higher -->
<!-- svelte-ignore missing-declaration -->
{#if compareVersions('1.21.4', $targetMinecraftVersion)}
	<LineEdit
		label="Display Item"
		description="Choose the item that will be used to display all the models for the rig."
		value={settings.display_item}
		defaultValue={defaultValues.display_item}
	/>
{/if}

<style>
</style>
