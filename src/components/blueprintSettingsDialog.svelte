<script lang="ts" context="module">
	import { Valuable } from '../util/stores'
	import { translate } from '../util/translation'

	import Checkbox from './dialog_items/checkbox.svelte'
	import NumberSlider from './dialog_items/numberSlider.svelte'
	import LineInput from './dialog_items/lineInput.svelte'
	import Vector2D from './dialog_items/vector2d.svelte'
	import Select from './dialog_items/select.svelte'
	import SectionHeader from './dialog_items/sectionHeader.svelte'
	import FileSelect from './dialog_items/fileSelect.svelte'
	import FolderSelect from './dialog_items/folderSelect.svelte'
</script>

<script lang="ts">
	export let blueprintName: Valuable<string>
	export let exportNamespace: Valuable<string>
	export let textureSizeX: Valuable<number>
	export let textureSizeY: Valuable<number>
	// Plugin Settings
	export let enablePluginMode: Valuable<boolean>
	// Resource Pack Settings
	export let enableResourcePack: Valuable<boolean>
	export let displayItem: Valuable<string>
	export let customModelDataOffset: Valuable<number>
	export let enableAdvancedResourcePackSettings: Valuable<boolean>
	export let resourcePack: Valuable<string>
	export let displayItemPath: Valuable<string>
	export let modelFolder: Valuable<string>
	export let textureFolder: Valuable<string>
	// Data Pack Settings
	export let enableDataPack: Valuable<boolean>
	export let enableAdvancedDataPackSettings: Valuable<boolean>
	export let dataPack: Valuable<string>
</script>

<div>
	<LineInput
		label={translate('dialog.blueprint_settings.blueprint_name.title')}
		tooltip={translate('dialog.blueprint_settings.blueprint_name.description')}
		bind:value={blueprintName}
	/>

	<LineInput
		label={translate('dialog.blueprint_settings.export_namespace.title')}
		tooltip={translate('dialog.blueprint_settings.export_namespace.description')}
		bind:value={exportNamespace}
	/>

	<Vector2D
		label={translate('dialog.blueprint_settings.texture_size.title')}
		tooltip={translate('dialog.blueprint_settings.texture_size.description')}
		bind:valueX={textureSizeX}
		minX={2}
		maxX={4096}
		bind:valueY={textureSizeY}
		minY={2}
		maxY={4096}
	/>

	<Checkbox
		label={translate('dialog.blueprint_settings.enable_plugin_mode.title')}
		tooltip={translate('dialog.blueprint_settings.enable_plugin_mode.description')}
		bind:checked={enablePluginMode}
	/>

	{#if $enablePluginMode}
		<LineInput
			label={translate('dialog.blueprint_settings.display_item.title')}
			tooltip={translate('dialog.blueprint_settings.display_item.description')}
			bind:value={displayItem}
		/>
	{:else}
		<Checkbox
			label={translate('dialog.blueprint_settings.enable_resource_pack.title')}
			tooltip={translate('dialog.blueprint_settings.enable_resource_pack.description')}
			bind:checked={enableResourcePack}
		/>
		<Checkbox
			label={translate('dialog.blueprint_settings.enable_data_pack.title')}
			tooltip={translate('dialog.blueprint_settings.enable_data_pack.description')}
			bind:checked={enableDataPack}
		/>

		{#if $enableResourcePack}
			<SectionHeader
				label={translate('dialog.blueprint_settings.resource_pack_settings.title')}
			/>
			<Checkbox
				label={translate(
					'dialog.blueprint_settings.enable_advanced_resource_pack_settings.title'
				)}
				bind:checked={enableAdvancedResourcePackSettings}
			/>
			{#if $enableAdvancedResourcePackSettings}
				<!--  -->
				<p class="advanced_settings_warning">
					Advanced settings should only be used if absolutely needed!
				</p>
				<LineInput
					label={translate('dialog.blueprint_settings.display_item.title')}
					tooltip={translate('dialog.blueprint_settings.display_item.description')}
					bind:value={displayItem}
				/>

				<NumberSlider
					label={translate('dialog.blueprint_settings.custom_model_data_offset.title')}
					tooltip={translate(
						'dialog.blueprint_settings.custom_model_data_offset.description'
					)}
					bind:value={customModelDataOffset}
				/>

				<FileSelect
					label={translate('dialog.blueprint_settings.display_item_path.title')}
					tooltip={translate('dialog.blueprint_settings.display_item_path.description')}
					bind:value={displayItemPath}
				/>

				<FolderSelect
					label={translate('dialog.blueprint_settings.model_folder.title')}
					tooltip={translate('dialog.blueprint_settings.model_folder.description')}
					bind:value={modelFolder}
				/>

				<FolderSelect
					label={translate('dialog.blueprint_settings.texture_folder.title')}
					tooltip={translate('dialog.blueprint_settings.texture_folder.description')}
					bind:value={textureFolder}
				/>
			{:else}
				<LineInput
					label={translate('dialog.blueprint_settings.display_item.title')}
					tooltip={translate('dialog.blueprint_settings.display_item.description')}
					bind:value={displayItem}
				/>

				<NumberSlider
					label={translate('dialog.blueprint_settings.custom_model_data_offset.title')}
					tooltip={translate(
						'dialog.blueprint_settings.custom_model_data_offset.description'
					)}
					bind:value={customModelDataOffset}
					min={0}
					max={2147483647}
				/>

				<FileSelect
					label={translate('dialog.blueprint_settings.resource_pack.title')}
					tooltip={translate('dialog.blueprint_settings.resource_pack.description')}
					bind:value={resourcePack}
				/>
			{/if}
		{/if}

		{#if $enableDataPack}
			<SectionHeader
				label={translate('dialog.blueprint_settings.data_pack_settings.title')}
			/>
			<Checkbox
				label={translate(
					'dialog.blueprint_settings.enable_advanced_data_pack_settings.title'
				)}
				bind:checked={enableAdvancedDataPackSettings}
			/>
			{#if $enableAdvancedDataPackSettings}
				<!--  -->
				<p class="advanced_settings_warning">
					Advanced settings should only be used if absolutely needed!
				</p>

				<FileSelect
					label={translate('dialog.blueprint_settings.data_pack.title')}
					tooltip={translate('dialog.blueprint_settings.data_pack.description')}
					bind:value={dataPack}
				/>
			{:else}
				<FileSelect
					label={translate('dialog.blueprint_settings.data_pack.title')}
					tooltip={translate('dialog.blueprint_settings.data_pack.description')}
					bind:value={dataPack}
				/>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.advanced_settings_warning {
		color: var(--color-warning);
		font-family: var(--font-code);
		font-size: 0.8em;
		margin-bottom: 8px;
	}
</style>
