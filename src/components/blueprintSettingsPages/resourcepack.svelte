<script lang="ts">
	import type { ValuableBlueprintSettings } from '../../interface/blueprintSettingsDialog'
	import { directoryExists, fileExists, resolvePath } from '../../util/fileUtil'
	import { isResourcePackPath } from '../../util/minecraftUtil'
	import { translate } from '../../util/translation'
	import BoxSelect from '../sidebarDialogItems/boxSelect.svelte'
	import Checkbox from '../sidebarDialogItems/checkbox.svelte'
	import FileSelect from '../sidebarDialogItems/fileSelect.svelte'
	import FolderSelect from '../sidebarDialogItems/folderSelect.svelte'
	export let settings: ValuableBlueprintSettings
	let resourcePackExportMode = settings.resource_pack_export_mode
	let advancedResourcePackFolders = settings.advanced_resource_pack_folders

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

	const advancedResourcePackFolderChecker: DialogItemValueChecker<string> = value => {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.advanced_resource_pack_folders.error.folder_does_not_exist',
				),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_folders.error.no_folder_selected',
					),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_folders.error.folder_does_not_exist',
					),
				}
			case !fs.statSync(path, { throwIfNoEntry: false })?.isDirectory():
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_folders.error.not_a_folder',
					),
				}
			case !isResourcePackPath(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_folders.error.not_a_resource_pack_folder',
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
		<Checkbox
			label="Use Advanced Resource Pack Folders"
			description="Get more freedom to select where specific resource pack files are exported."
			checked={advancedResourcePackFolders}
		/>
		{#if $advancedResourcePackFolders}
			<FolderSelect
				label="Model Folder"
				description="Where to export generated models."
				value={settings.model_folder}
				placeholder="Select a Folder"
				required
				valueChecker={advancedResourcePackFolderChecker}
			/>
			<FolderSelect
				label="Texture Folder"
				description="Where to export generated textures."
				value={settings.texture_folder}
				placeholder="Select a Folder"
				required
				valueChecker={advancedResourcePackFolderChecker}
			/>
		{:else}
			<FolderSelect
				label="Export Folder"
				description="Choose the folder to export the Resource Pack to."
				value={settings.resource_pack}
				placeholder="Select a Folder"
				required
				valueChecker={resourcePackFolderChecker}
			/>
		{/if}
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

<style>
</style>
