<script lang="ts">
	import type { ValuableBlueprintSettings } from '../../interface/blueprintSettingsDialog'
	import FolderSelect from '../sidebarDialogItems/folderSelect.svelte'
	import BoxSelect from '../sidebarDialogItems/boxSelect.svelte'
	import { resolvePath } from '../../util/fileUtil'
	import { translate } from '../../util/translation'
	import FileSelect from '../sidebarDialogItems/fileSelect.svelte'
	import CodeBox from '../sidebarDialogItems/codeBox.svelte'

	export let settings: ValuableBlueprintSettings
	let datapackExportMode = settings.data_pack_export_mode
	let animationSystem = settings.animation_system

	const dataPackFolderChecker: DialogItemValueChecker<string> = value => {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.data_pack.error.folder_does_not_exist',
				),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.data_pack.error.no_folder_selected',
					),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.data_pack.error.folder_does_not_exist',
					),
				}
			case !fs.statSync(path).isDirectory():
				return {
					type: 'error',
					message: translate('dialog.blueprint_settings.data_pack.error.not_a_folder'),
				}
			case !fs.existsSync(PathModule.join(path, 'pack.mcmeta')):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.data_pack.error.missing_pack_mcmeta',
					),
				}
			case !fs.existsSync(PathModule.join(path, 'data')):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.data_pack.error.missing_data_folder',
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
		console.log(path)
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack_zip.error.no_file_selected',
					),
				}
			case fs.existsSync(path) && !fs.statSync(path).isFile():
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack_zip.error.not_a_file',
					),
				}
			default:
				return { type: 'success', message: '' }
		}
	}
</script>

<BoxSelect
	label="Export Mode"
	description="Choose the environment you will be using to run your project."
	selected={datapackExportMode}
	options={{
		folder: {
			type: 'text',
			label: 'Export to Folder',
			description: 'Export the generated Data Pack to a folder.',
		},
		zip: {
			type: 'text',
			label: 'Export to Zip',
			description: 'Export the generated Data Pack to a zip file.',
		},
		none: {
			type: 'text',
			label: 'Do Not Export',
			description: 'Do not export a Data Pack.',
		},
	}}
/>

{#if $datapackExportMode !== 'none'}
	{#if $datapackExportMode === 'folder'}
		<FolderSelect
			label="Export Folder"
			description="Choose the folder to export the Data Pack to."
			value={settings.data_pack}
			placeholder="Select a Folder"
			required
			valueChecker={dataPackFolderChecker}
		/>
	{:else if $datapackExportMode === 'zip'}
		<FileSelect
			label="Export File"
			description="Choose the file to export the Data Pack to."
			value={settings.data_pack}
			placeholder="Select a File"
			required
			valueChecker={zipChecker}
		/>
	{/if}

	<CodeBox
		label="On Summon Commands"
		description="Commands that will be run as the root entity when the model is summoned. This input is treated as a function file, and supports MC-Build syntax."
		value={settings.summon_commands}
	/>

	<CodeBox
		label="Ticking Commands"
		description="Commands that will be run as the root entity every tick. This input is treated as a function file, and supports MC-Build syntax."
		value={settings.ticking_commands}
	/>

	<BoxSelect
		label="Animation System"
		description="Choose the animation system to use for the project."
		selected={animationSystem}
		options={{
			functions: {
				type: 'text',
				label: 'Function-based',
				description: 'Fast and simple, but creates a lot of function files.',
			},
			storage: {
				type: 'text',
				label: 'Storage-based',
				description: 'Slow and complex, but creates far fewer function files.',
			},
		}}
	/>
{/if}
