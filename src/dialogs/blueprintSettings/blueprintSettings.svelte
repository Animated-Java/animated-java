<script lang="ts" module>
	import { observable, type Observable } from 'svelte-observable-store'
	import { fs } from '../../constants'
	import { defaultValues } from '../../formats/blueprint/settings'
	import mcbFiles from '../../systems/datapackCompiler/mcbFiles'
	import { localize as translate } from '../../util/lang'

	import Checkbox from '../../svelteComponents/dialogItems/checkbox.svelte'
	import CodeInput from '../../svelteComponents/dialogItems/codeInput.svelte'
	import FileSelect from '../../svelteComponents/dialogItems/fileSelect.svelte'
	import FolderSelect from '../../svelteComponents/dialogItems/folderSelect.svelte'
	import LineInput from '../../svelteComponents/dialogItems/lineInput.svelte'
	import NumberSlider from '../../svelteComponents/dialogItems/numberSlider.svelte'
	import SectionHeader from '../../svelteComponents/dialogItems/sectionHeader.svelte'
	import Select from '../../svelteComponents/dialogItems/select.svelte'
	import Vector2D from '../../svelteComponents/dialogItems/vector2d.svelte'

	import fontUrl from '../../assets/MinecraftFull.ttf'
	import { getJSONAsset } from '../../systems/minecraft/assetManager'
	import type { IItemModel } from '../../systems/minecraft/model'
	import { getRegistryEntry } from '../../systems/minecraft/registryManager'
	import { resolvePath } from '../../util/fileUtil'

	if (![...document.fonts.keys()].some(v => v.family === 'MinecraftFull')) {
		void new FontFace('MinecraftFull', fontUrl, {}).load().then(font => {
			document.fonts.add(font)
		})
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
		} else if (/[^a-zA-Z0-9_]/.exec(value.trim())) {
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

	async function displayItemChecker(value: string): Promise<{ type: string; message: string }> {
		const itemRegistry = await getRegistryEntry(
			Project.animated_java.target_minecraft_version,
			'item'
		)
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
		} else if (itemRegistry.has(value.replace('minecraft:', ''))) {
			return {
				type: 'warning',
				message: translate(
					'dialog.blueprint_settings.display_item.warning.item_does_not_exist'
				),
			}
		} else {
			let asset: IItemModel
			try {
				asset = await getJSONAsset(
					Project.animated_java.target_minecraft_version,
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
		const largestHeight = Number(
			Texture.all.map(t => t.height).reduce((max, cur) => Math.max(max, cur), 0)
		)
		const largestWidth = Number(
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

	function jsonFileChecker(value: string): { type: string; message: string } {
		let path: string
		try {
			path = resolvePath(value)
		} catch (e) {
			console.error(e)
			return {
				type: 'error',
				message: translate('dialog.blueprint_settings.json_file.error.invalid_path'),
			}
		}
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

<script lang="ts">
	export let blueprintName: Observable<string>
	export let textureSizeX: Observable<number>
	export let textureSizeY: Observable<number>
	// Export Settings
	export let exportNamespace: Observable<string>
	export let enablePluginMode: Observable<boolean>
	export let resourcePackExportMode: Observable<string>
	export let dataPackExportMode: Observable<string>
	export let targetMinecraftVersion: Observable<string>
	// Bounding Box
	export let showRenderBox: Observable<boolean>
	export let autoRenderBox: Observable<boolean>
	export let renderBoxX: Observable<number>
	export let renderBoxY: Observable<number>
	// Resource Pack Settings
	export let displayItem: Observable<string>
	export let customModelDataOffset: Observable<number>
	export let enableAdvancedResourcePackSettings: Observable<boolean>
	export let resourcePack: Observable<string>
	// Data Pack Settings
	// export let enableAdvancedDataPackSettings: Observable<boolean>
	export let dataPack: Observable<string>

	export let onSummonFunction: Observable<string>
	export let onRemoveFunction: Observable<string>
	export let onPreTickFunction: Observable<string>
	export let onPostTickFunction: Observable<string>

	export let interpolationDuration: Observable<number>
	export let teleportationDuration: Observable<number>
	export let useStorageForAnimation: Observable<boolean>
	export let autoUpdateRigOrientation: Observable<boolean>
	// Plugin Export Settings
	export let bakedAnimations: Observable<boolean>
	export let jsonFile: Observable<string>

	const DISPLAY_ITEM_REQUIRED = observable(false)
	$: {
		$DISPLAY_ITEM_REQUIRED = compareVersions('1.21.2', $targetMinecraftVersion)
	}
</script>

<div class="container">
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

	<Checkbox
		label={translate('dialog.blueprint_settings.enable_plugin_mode.title')}
		tooltip={translate('dialog.blueprint_settings.enable_plugin_mode.description')}
		bind:checked={enablePluginMode}
		defaultValue={defaultValues.enable_plugin_mode}
	/>

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

		<SectionHeader
			label={translate('dialog.blueprint_settings.resource_pack_settings.title')}
		/>

		<Select
			label={translate('dialog.blueprint_settings.resource_pack_export_mode.title')}
			options={{
				folder: translate(
					'dialog.blueprint_settings.resource_pack_export_mode.options.folder'
				),
				none: translate('dialog.blueprint_settings.resource_pack_export_mode.options.none'),
			}}
			defaultOption={'folder'}
			bind:value={resourcePackExportMode}
		/>

		{#if $resourcePackExportMode !== 'none'}
			{#if $DISPLAY_ITEM_REQUIRED}
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
				tooltip={translate(
					'dialog.blueprint_settings.auto_update_rig_orientation.description'
				)}
				bind:checked={autoUpdateRigOrientation}
				defaultValue={defaultValues.auto_update_rig_orientation}
			/>

			<Checkbox
				label={translate('dialog.blueprint_settings.use_storage_for_animation.title')}
				tooltip={translate(
					'dialog.blueprint_settings.use_storage_for_animation.description'
				)}
				bind:checked={useStorageForAnimation}
				defaultValue={defaultValues.use_storage_for_animation}
			/>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-height: 75vh;
		overflow: auto;
	}
	.warning {
		color: var(--color-warning);
		font-family: var(--font-code);
		font-size: 0.8em;
		margin: -16px 29px 8px;
	}
</style>
