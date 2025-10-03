<script lang="ts" context="module">
	import { defaultValues } from '../blueprintSettings'
	import mcbFiles from '../systems/datapackCompiler/mcbFiles'
	import { MINECRAFT_REGISTRY } from '../systems/minecraft/registryManager'
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'

	import Checkbox from './dialogItems/checkbox.svelte'
	import CodeInput from './dialogItems/codeInput.svelte'
	import FileSelect from './dialogItems/fileSelect.svelte'
	import FolderSelect from './dialogItems/folderSelect.svelte'
	import LineInput from './dialogItems/lineInput.svelte'
	import NumberSlider from './dialogItems/numberSlider.svelte'
	import SectionHeader from './dialogItems/sectionHeader.svelte'
	import Select from './dialogItems/select.svelte'
	import Vector2D from './dialogItems/vector2d.svelte'

	import fontUrl from '../assets/MinecraftFull.ttf'
	import { getJSONAsset } from '../systems/minecraft/assetManager'
	import type { IItemModel } from '../systems/minecraft/model'
	import { resolvePath } from '../util/fileUtil'

	if (![...document.fonts.keys()].some(v => v.family === 'MinecraftFull')) {
		void new FontFace('MinecraftFull', fontUrl, {}).load().then(font => {
			document.fonts.add(font)
		})
	}
</script>

<script lang="ts">
	export let blueprintName: Valuable<string>
	export let textureSizeX: Valuable<number>
	export let textureSizeY: Valuable<number>
	// Export Settings
	export let exportNamespace: Valuable<string>
	export let enablePluginMode: Valuable<boolean>
	// FIXME - Force-disable plugin mode for now
	$enablePluginMode = false
	export let resourcePackExportMode: Valuable<string>
	export let dataPackExportMode: Valuable<string>
	export let targetMinecraftVersion: Valuable<string>
	// Bounding Box
	export let showRenderBox: Valuable<boolean>
	export let autoRenderBox: Valuable<boolean>
	export let renderBoxX: Valuable<number>
	export let renderBoxY: Valuable<number>
	// Resource Pack Settings
	export let displayItem: Valuable<string>
	export let customModelDataOffset: Valuable<number>
	export let enableAdvancedResourcePackSettings: Valuable<boolean>
	export let resourcePack: Valuable<string>
	// Data Pack Settings
	// export let enableAdvancedDataPackSettings: Valuable<boolean>
	export let dataPack: Valuable<string>

	export let onSummonFunction: Valuable<string>
	export let onRemoveFunction: Valuable<string>
	export let onPreTickFunction: Valuable<string>
	export let onPostTickFunction: Valuable<string>

	export let interpolationDuration: Valuable<number>
	export let teleportationDuration: Valuable<number>
	export let useStorageForAnimation: Valuable<boolean>
	export let autoUpdateRigOrientation: Valuable<boolean>
	// Plugin Export Settings
	export let bakedAnimations: Valuable<boolean>
	export let jsonFile: Valuable<string>

	const requiresDisplayItem = new Valuable(false)
	$: {
		$requiresDisplayItem = compareVersions('1.21.2', $targetMinecraftVersion)
	}

	const TARGETABLE_VERSIONS = Object.fromEntries(
		Object.entries(mcbFiles).map(([key]) => [key, key])
	)

	function exportNamespaceChecker(value: string): { type: string; message: string } {
		if (value === '') {
			return {
				type: 'error',
				message: translate('dialog.blueprint_settings.export_namespace.error.empty'),
			}
		} else if (value.trim().match('[^a-zA-Z0-9_]')) {
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.export_namespace.error.invalid_characters'
				),
			}
		} else if (['global', 'animated_java'].includes(value)) {
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.export_namespace.error.reserved',
					value
				),
			}
		} else {
			return { type: 'success', message: '' }
		}
	}

	function displayItemChecker(value: string): { type: string; message: string } {
		if (value === '') {
			return {
				type: 'error',
				message: translate('dialog.blueprint_settings.display_item.error.no_item_selected'),
			}
		} else if (value.split(':').length !== 2) {
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.display_item.error.invalid_item_id.no_namespace'
				),
			}
		} else if (value.includes(' ')) {
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.display_item.error.invalid_item_id.whitespace'
				),
			}
		} else if (
			MINECRAFT_REGISTRY.item &&
			!MINECRAFT_REGISTRY.item.has(value.replace('minecraft:', ''))
		) {
			return {
				type: 'warning',
				message: translate(
					'dialog.blueprint_settings.display_item.warning.item_does_not_exist'
				),
			}
		} else {
			let asset: IItemModel
			try {
				asset = getJSONAsset(
					'assets/minecraft/models/item/' + value.replace('minecraft:', '') + '.json'
				)
			} catch (e) {
				console.error(e)
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.display_item.error.item_model_not_found'
					),
				}
			}

			if (
				!(asset.parent === 'item/generated' || asset.parent === 'minecraft:item/generated')
			) {
				return {
					type: 'warning',
					message: translate(
						'dialog.blueprint_settings.display_item.warning.item_model_not_generated'
					),
				}
			}

			return { type: 'success', message: '' }
		}
	}

	function textureSizeChecker(value: { x: number; y: number }): {
		type: string
		message: string
	} {
		const x = Number(value.x)
		const y = Number(value.y)
		const largestHeight: number = Number(
			Texture.all.map(t => t.height).reduce((max, cur) => Math.max(max, cur), 0)
		)
		const largestWidth: number = Number(
			Texture.all.map(t => t.width).reduce((max, cur) => Math.max(max, cur), 0)
		)

		if (!(x === largestWidth && y === largestHeight)) {
			return {
				type: 'warning',
				message: translate(
					'dialog.blueprint_settings.texture_size.warning.does_not_match_largest_texture'
				),
			}
		} else if (x !== y) {
			return {
				type: 'warning',
				message: translate('dialog.blueprint_settings.texture_size.warning.not_square'),
			}
		} else if (x !== 2 ** Math.floor(Math.log2(x)) || y !== 2 ** Math.floor(Math.log2(y))) {
			return {
				type: 'warning',
				message: translate(
					'dialog.blueprint_settings.texture_size.warning.not_a_power_of_2'
				),
			}
		} else {
			return {
				type: 'success',
				message: '',
			}
		}
	}

	function dataPackFolderChecker(value: string): { type: string; message: string } {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.data_pack.error.folder_does_not_exist'
				),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.data_pack.error.no_folder_selected'
					),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.data_pack.error.folder_does_not_exist'
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
						'dialog.blueprint_settings.data_pack.error.missing_pack_mcmeta'
					),
				}
			case !fs.existsSync(PathModule.join(path, 'data')):
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

	function resourcePackFolderChecker(value: string): { type: string; message: string } {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.resource_pack.error.folder_does_not_exist'
				),
			}
		}
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.no_folder_selected'
					),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.folder_does_not_exist'
					),
				}
			case !fs.statSync(path).isDirectory():
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.not_a_folder'
					),
				}
			case !fs.existsSync(PathModule.join(path, 'pack.mcmeta')):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack.error.missing_pack_mcmeta'
					),
				}
			case !fs.existsSync(PathModule.join(path, 'assets')):
				return {
					type: 'warning',
					message: translate(
						'dialog.blueprint_settings.resource_pack.warning.missing_assets_folder'
					),
				}
			default:
				return { type: 'success', message: '' }
		}
	}

	function advancedResourcePackFileChecker(value: string): { type: string; message: string } {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.advanced_resource_pack_file.error.file_does_not_exist'
				),
			}
		}
		console.log(path)
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_file.error.no_file_selected'
					),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_file.error.file_does_not_exist'
					),
				}
			case !fs.statSync(path).isFile():
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_file.error.not_a_file'
					),
				}
			default:
				return { type: 'success', message: '' }
		}
	}

	function jsonFileChecker(value: string): { type: string; message: string } {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate('dialog.blueprint_settings.json_file.error.file_does_not_exist'),
			}
		}
		console.log(path)
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.json_file.error.no_file_selected'
					),
				}
			case fs.existsSync(path) && !fs.statSync(path).isFile():
				return {
					type: 'error',
					message: translate('dialog.blueprint_settings.json_file.error.not_a_file'),
				}
			default:
				return { type: 'success', message: '' }
		}
	}

	function advancedResourcePackFolderChecker(value: string): { type: string; message: string } {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.advanced_resource_pack_folder.error.folder_does_not_exist'
				),
			}
		}
		console.log(path)
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_folder.error.no_folder_selected'
					),
				}
			case !fs.existsSync(path):
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_folder.error.folder_does_not_exist'
					),
				}
			case !fs.statSync(path).isDirectory():
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.advanced_resource_pack_folder.error.not_a_folder'
					),
				}
			default:
				return { type: 'success', message: '' }
		}
	}

	function zipChecker(value: string): { type: string; message: string } {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate(
					'dialog.blueprint_settings.data_pack_zip.error.file_does_not_exist'
				),
			}
		}
		console.log(path)
		switch (true) {
			case value === '':
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack_zip.error.no_file_selected'
					),
				}
			case fs.existsSync(path) && !fs.statSync(path).isFile():
				return {
					type: 'error',
					message: translate(
						'dialog.blueprint_settings.resource_pack_zip.error.not_a_file'
					),
				}
			default:
				return { type: 'success', message: '' }
		}
	}
</script>

<SectionHeader label={translate('dialog.blueprint_settings.project_settings.title')} />

<LineInput
	label={translate('dialog.blueprint_settings.project_name.title')}
	tooltip={translate('dialog.blueprint_settings.project_name.description')}
	bind:value={blueprintName}
	defaultValue={'My Blueprint'}
/>

<Vector2D
	label={translate('dialog.blueprint_settings.texture_size.title')}
	tooltip={translate('dialog.blueprint_settings.texture_size.description')}
	bind:valueX={textureSizeX}
	defaultValueX={16}
	minX={2}
	maxX={4096}
	bind:valueY={textureSizeY}
	defaultValueY={16}
	minY={2}
	maxY={4096}
	valueChecker={textureSizeChecker}
/>

<Checkbox
	label={translate('dialog.blueprint_settings.show_render_box.title')}
	tooltip={translate('dialog.blueprint_settings.show_render_box.description')}
	bind:checked={showRenderBox}
	defaultValue={defaultValues.show_render_box}
/>

<Checkbox
	label={translate('dialog.blueprint_settings.auto_render_box.title')}
	tooltip={translate('dialog.blueprint_settings.auto_render_box.description')}
	bind:checked={autoRenderBox}
	defaultValue={defaultValues.auto_render_box}
/>

{#if !$autoRenderBox}
	<Vector2D
		label={translate('dialog.blueprint_settings.render_box.title')}
		tooltip={translate('dialog.blueprint_settings.render_box.description')}
		bind:valueX={renderBoxX}
		defaultValueX={defaultValues.render_box[0]}
		minX={2}
		maxX={4096}
		bind:valueY={renderBoxY}
		defaultValueY={defaultValues.render_box[1]}
		minY={2}
		maxY={4096}
	/>
{/if}

<SectionHeader label={translate('dialog.blueprint_settings.export_settings.title')} />

<LineInput
	label={translate('dialog.blueprint_settings.export_namespace.title')}
	tooltip={translate('dialog.blueprint_settings.export_namespace.description')}
	bind:value={exportNamespace}
	defaultValue={defaultValues.export_namespace}
	valueChecker={exportNamespaceChecker}
/>

<!-- <Checkbox
		label={translate('dialog.blueprint_settings.enable_plugin_mode.title')}
		tooltip={translate('dialog.blueprint_settings.enable_plugin_mode.description')}
		bind:checked={enablePluginMode}
		defaultValue={defaultValues.enable_plugin_mode}
	/> -->

{#if $enablePluginMode}
	<LineInput
		label={translate('dialog.blueprint_settings.display_item.title')}
		tooltip={translate('dialog.blueprint_settings.display_item.description')}
		bind:value={displayItem}
		defaultValue={defaultValues.display_item}
		valueChecker={displayItemChecker}
	/>

	<Checkbox
		label={translate('dialog.blueprint_settings.baked_animations.title')}
		tooltip={translate('dialog.blueprint_settings.baked_animations.description')}
		bind:checked={bakedAnimations}
		defaultValue={defaultValues.baked_animations}
	/>

	<FileSelect
		label={translate('dialog.blueprint_settings.json_file.title')}
		tooltip={translate('dialog.blueprint_settings.json_file.description')}
		bind:value={jsonFile}
		defaultValue={defaultValues.json_file}
		valueChecker={jsonFileChecker}
	/>
{:else}
	<Select
		label={translate('dialog.blueprint_settings.target_minecraft_version.title')}
		tooltip={translate('dialog.blueprint_settings.target_minecraft_version.description')}
		options={TARGETABLE_VERSIONS}
		defaultOption={Object.keys(TARGETABLE_VERSIONS).at(-1) ?? '1.20.4'}
		bind:value={targetMinecraftVersion}
	/>

	<SectionHeader label={translate('dialog.blueprint_settings.resource_pack_settings.title')} />

	<Select
		label={translate('dialog.blueprint_settings.resource_pack_export_mode.title')}
		options={{
			folder: translate('dialog.blueprint_settings.resource_pack_export_mode.options.folder'),
			none: translate('dialog.blueprint_settings.resource_pack_export_mode.options.none'),
		}}
		defaultOption={'folder'}
		bind:value={resourcePackExportMode}
	/>

	{#if $resourcePackExportMode !== 'none'}
		{#if $requiresDisplayItem}
			<LineInput
				label={translate('dialog.blueprint_settings.display_item.title')}
				tooltip={translate('dialog.blueprint_settings.display_item.description')}
				bind:value={displayItem}
				defaultValue={defaultValues.display_item}
				valueChecker={displayItemChecker}
			/>
		{/if}

		{#if $resourcePackExportMode === 'folder'}
			<FolderSelect
				label={translate('dialog.blueprint_settings.resource_pack.title')}
				tooltip={translate('dialog.blueprint_settings.resource_pack.description')}
				bind:value={resourcePack}
				defaultValue={defaultValues.resource_pack}
				valueChecker={resourcePackFolderChecker}
			/>
		{:else if $resourcePackExportMode === 'zip'}
			<FileSelect
				label={translate('dialog.blueprint_settings.resource_pack_zip.title')}
				tooltip={translate('dialog.blueprint_settings.resource_pack_zip.description')}
				bind:value={resourcePack}
				defaultValue={defaultValues.resource_pack}
				valueChecker={zipChecker}
			/>
		{/if}

		<Checkbox
			label={translate(
				'dialog.blueprint_settings.enable_advanced_resource_pack_settings.title'
			)}
			bind:checked={enableAdvancedResourcePackSettings}
			defaultValue={defaultValues.enable_advanced_resource_pack_settings}
		/>

		{#if $enableAdvancedResourcePackSettings}
			<p class="warning">
				{translate('dialog.blueprint_settings.advanced_settings_warning')}
			</p>

			<NumberSlider
				label={translate('dialog.blueprint_settings.custom_model_data_offset.title')}
				tooltip={translate(
					'dialog.blueprint_settings.custom_model_data_offset.description'
				)}
				bind:value={customModelDataOffset}
				defaultValue={defaultValues.custom_model_data_offset}
				min={0}
				max={2147483647}
				valueStep={1}
			/>
		{/if}
	{/if}

	<SectionHeader label={translate('dialog.blueprint_settings.data_pack_settings.title')} />

	<Select
		label={translate('dialog.blueprint_settings.data_pack_export_mode.title')}
		options={{
			folder: translate('dialog.blueprint_settings.data_pack_export_mode.options.folder'),
			none: translate('dialog.blueprint_settings.data_pack_export_mode.options.none'),
		}}
		defaultOption={'folder'}
		bind:value={dataPackExportMode}
	/>

	{#if $dataPackExportMode !== 'none'}
		{#if $dataPackExportMode === 'folder'}
			<FolderSelect
				label={translate('dialog.blueprint_settings.data_pack.title')}
				tooltip={translate('dialog.blueprint_settings.data_pack.description')}
				bind:value={dataPack}
				defaultValue={defaultValues.data_pack}
				valueChecker={dataPackFolderChecker}
			/>
		{:else if $dataPackExportMode === 'zip'}
			<FileSelect
				label={translate('dialog.blueprint_settings.data_pack_zip.title')}
				tooltip={translate('dialog.blueprint_settings.data_pack_zip.description')}
				bind:value={dataPack}
				defaultValue={defaultValues.data_pack}
				valueChecker={zipChecker}
			/>
		{/if}

		<CodeInput
			label={translate('dialog.blueprint_settings.on_summon_function.title')}
			tooltip={translate('dialog.blueprint_settings.on_summon_function.description')}
			bind:value={onSummonFunction}
			defaultValue={defaultValues.on_summon_function}
		/>

		<CodeInput
			label={translate('dialog.blueprint_settings.on_remove_function.title')}
			tooltip={translate('dialog.blueprint_settings.on_remove_function.description')}
			bind:value={onRemoveFunction}
			defaultValue={defaultValues.on_remove_function}
		/>

		<CodeInput
			label={translate('dialog.blueprint_settings.on_pre_tick_function.title')}
			tooltip={translate('dialog.blueprint_settings.on_pre_tick_function.description')}
			bind:value={onPreTickFunction}
			defaultValue={defaultValues.on_pre_tick_function}
		/>

		<CodeInput
			label={translate('dialog.blueprint_settings.on_post_tick_function.title')}
			tooltip={translate('dialog.blueprint_settings.on_post_tick_function.description')}
			bind:value={onPostTickFunction}
			defaultValue={defaultValues.on_post_tick_function}
		/>

		<NumberSlider
			label={translate('dialog.blueprint_settings.interpolation_duration.title')}
			tooltip={translate('dialog.blueprint_settings.interpolation_duration.description')}
			bind:value={interpolationDuration}
			defaultValue={defaultValues.interpolation_duration}
			min={0}
			max={2147483647}
			valueStep={1}
		/>

		<NumberSlider
			label={translate('dialog.blueprint_settings.teleportation_duration.title')}
			tooltip={translate('dialog.blueprint_settings.teleportation_duration.description')}
			bind:value={teleportationDuration}
			defaultValue={defaultValues.teleportation_duration}
			min={0}
			max={2147483647}
			valueStep={1}
		/>

		<Checkbox
			label={translate('dialog.blueprint_settings.auto_update_rig_orientation.title')}
			tooltip={translate('dialog.blueprint_settings.auto_update_rig_orientation.description')}
			bind:checked={autoUpdateRigOrientation}
			defaultValue={defaultValues.auto_update_rig_orientation}
		/>

		<Checkbox
			label={translate('dialog.blueprint_settings.use_storage_for_animation.title')}
			tooltip={translate('dialog.blueprint_settings.use_storage_for_animation.description')}
			bind:checked={useStorageForAnimation}
			defaultValue={defaultValues.use_storage_for_animation}
		/>
	{/if}
{/if}

<style>
	.warning {
		color: var(--color-warning);
		font-family: var(--font-code);
		font-size: 0.8em;
		margin: -16px 29px 8px;
	}
</style>
