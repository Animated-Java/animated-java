<script lang="ts">
	import BoxSelect from '@svelte-components/sidebar-dialog-items/boxSelect.svelte'
	import CodeBox from '@svelte-components/sidebar-dialog-items/codeBox.svelte'
	import FileSelect from '@svelte-components/sidebar-dialog-items/fileSelect.svelte'
	import FolderSelect from '@svelte-components/sidebar-dialog-items/folderSelect.svelte'
	import NumberSlider from '@svelte-components/sidebar-dialog-items/numberSlider.svelte'
	import type { ValuableBlueprintSettings } from '../'
	import { directoryExists, fileExists, resolvePath } from '../../../../util/fileUtil'
	import { translate } from '../../../../util/translation'

	export let settings: ValuableBlueprintSettings
	const EXPORT_MODE = settings.data_pack_export_mode
	const ANIMATION_SYSTEM = settings.animation_system

	const dataPackFolderChecker: DialogItemValueChecker<string> = value => {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate('dialog.error.folder_does_not_exist'),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate('dialog.error.no_folder_selected'),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate('dialog.error.folder_does_not_exist'),
				}
			case !fs.statSync(path).isDirectory():
				return {
					type: 'error',
					message: translate('dialog.error.not_a_folder'),
				}
			case !fileExists(PathModule.join(path, 'pack.mcmeta')):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.datapack.error.missing_pack_mcmeta'
					),
				}
			case !directoryExists(PathModule.join(path, 'data')):
				return {
					type: 'warning',
					message: translate(
						'dialog.blueprint_settings.data_pack.warning.missing_data_folder'
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
				message: translate('dialog.error.file_does_not_exist'),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate('dialog.error.no_file_selected'),
				}
			case !path.endsWith('.zip'):
				return {
					type: 'error',
					message: translate('dialog.error.not_a_zip_file'),
				}
			case fs.existsSync(path) && !fs.statSync(path).isFile():
				return {
					type: 'error',
					message: translate('dialog.error.not_a_file'),
				}
			default:
				return { type: 'success' }
		}
	}

	const functionFileChecker: DialogItemValueChecker<string> = value => {
		const commands = value.split('\n').map(line => line.trim())
		if (commands.some(line => line.startsWith('/'))) {
			return {
				type: 'error',
				message: translate('dialog.error.function_file.no_leading_slash'),
			}
		}
		return { type: 'success' }
	}
</script>

<BoxSelect
	selected={EXPORT_MODE}
	options={{
		folder: {
			type: 'text',
			label: translate('dialog.blueprint_settings.datapack.export_mode.folder.label'),
			description: translate(
				'dialog.blueprint_settings.datapack.export_mode.folder.description'
			),
		},
		zip: {
			type: 'text',
			label: translate('dialog.blueprint_settings.datapack.export_mode.zip.label'),
			description: translate(
				'dialog.blueprint_settings.datapack.export_mode.zip.description'
			),
		},
		none: {
			type: 'text',
			label: translate('dialog.blueprint_settings.datapack.export_mode.none.label'),
			description: translate(
				'dialog.blueprint_settings.datapack.export_mode.none.description'
			),
		},
	}}
/>

{#if $EXPORT_MODE !== 'none'}
	{#if $EXPORT_MODE === 'folder'}
		<FolderSelect
			label={translate('dialog.blueprint_settings.datapack.export_folder.label')}
			description={translate('dialog.blueprint_settings.datapack.export_folder.description')}
			value={settings.data_pack}
			placeholder={translate('dialog.placeholder.select_a_folder')}
			required
			valueChecker={dataPackFolderChecker}
		/>
	{:else}
		<FileSelect
			label={translate('dialog.blueprint_settings.datapack.export_zip.label')}
			description={translate('dialog.blueprint_settings.datapack.export_zip.description')}
			value={settings.data_pack}
			placeholder={translate('dialog.placeholder.select_a_file')}
			required
			valueChecker={zipChecker}
		/>
	{/if}

	<CodeBox
		label={translate('dialog.blueprint_settings.datapack.on_summon_commands.label')}
		description={translate('dialog.blueprint_settings.datapack.on_summon_commands.description')}
		value={settings.summon_commands}
		valueChecker={functionFileChecker}
	/>

	<CodeBox
		label={translate('dialog.blueprint_settings.datapack.on_tick_commands.label')}
		description={translate('dialog.blueprint_settings.datapack.on_tick_commands.description')}
		value={settings.ticking_commands}
		valueChecker={functionFileChecker}
	/>

	<NumberSlider
		label={translate('dialog.blueprint_settings.datapack.interpolation_duration.label')}
		description={translate(
			'dialog.blueprint_settings.datapack.interpolation_duration.description'
		)}
		value={settings.interpolation_duration}
		min={0}
		max={100}
		step={1}
	/>

	<NumberSlider
		label={translate('dialog.blueprint_settings.datapack.teleportation_duration.label')}
		description={translate(
			'dialog.blueprint_settings.datapack.teleportation_duration.description'
		)}
		value={settings.teleportation_duration}
		min={0}
		max={100}
		step={1}
	/>

	<BoxSelect
		label={translate('dialog.blueprint_settings.datapack.animation_system.label')}
		description={translate('dialog.blueprint_settings.datapack.animation_system.description')}
		selected={ANIMATION_SYSTEM}
		options={{
			functions: {
				type: 'text',
				label: translate(
					'dialog.blueprint_settings.datapack.animation_system.functions.label'
				),
				description: translate(
					'dialog.blueprint_settings.datapack.animation_system.functions.description'
				),
			},
			storage: {
				type: 'text',
				label: translate(
					'dialog.blueprint_settings.datapack.animation_system.storage.label'
				),
				description: translate(
					'dialog.blueprint_settings.datapack.animation_system.storage.description'
				),
			},
		}}
	/>
{/if}
