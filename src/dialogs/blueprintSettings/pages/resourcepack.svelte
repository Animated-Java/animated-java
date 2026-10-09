<script lang="ts">
	import { onDestroy } from 'svelte'
	import {
		validateResourcePackFolder,
		validateZipPath,
	} from '../../../formats/blueprint/settings'
	import BoxSelect from '../../../svelteComponents/sidebarDialogItems/boxSelect.svelte'
	import LineEdit from '../../../svelteComponents/sidebarDialogItems/lineEdit.svelte'
	import SelectFile from '../../../svelteComponents/sidebarDialogItems/selectFile.svelte'
	import SelectFolder from '../../../svelteComponents/sidebarDialogItems/selectFolder.svelte'
	import { createScopedTranslator } from '../../../util/lang'

	const translate = createScopedTranslator('dialog.blueprint_settings')

	let resourcePackExportFormat = $state(Project.animated_java.resource_pack_export_mode)
	let resourcePackLocation = $state(Project.animated_java.resource_pack)
	let displayItem = $state(Project.animated_java.display_item)

	onDestroy(() => {
		Project.animated_java.resource_pack_export_mode = resourcePackExportFormat
		Project.animated_java.resource_pack = resourcePackLocation
		Project.animated_java.display_item = displayItem
	})
</script>

<div class="dialog-page-container">
	<BoxSelect
		label={translate('resource_pack_export_mode.title')}
		options={{
			folder: {
				type: 'text',
				label: translate('resource_pack_export_mode.options.folder.title'),
				description: translate('resource_pack_export_mode.options.folder.description'),
			},
			zip: {
				type: 'text',
				label: translate('resource_pack_export_mode.options.zip.title'),
				description: translate('resource_pack_export_mode.options.zip.description'),
			},
			none: {
				type: 'text',
				label: translate('resource_pack_export_mode.options.none.title'),
				description: translate('resource_pack_export_mode.options.none.description'),
			},
		}}
		bind:selected={resourcePackExportFormat}
	></BoxSelect>

	{#if resourcePackExportFormat === 'folder'}
		<SelectFolder
			label={translate('resource_pack.folder.title')}
			description={translate('resource_pack.folder.description')}
			bind:value={resourcePackLocation}
			checkValue={validateResourcePackFolder}
			required
		></SelectFolder>
	{:else if resourcePackExportFormat === 'zip'}
		<SelectFile
			label={translate('resource_pack.zip.title')}
			description={translate('resource_pack.zip.description')}
			bind:value={resourcePackLocation}
			checkValue={validateZipPath}
			required
		></SelectFile>
	{/if}

	{#if resourcePackExportFormat !== 'none'}
		{#if Project.animated_java.enable_plugin_mode || VersionUtil.compare('1.21.2', '>', Project.animated_java.target_minecraft_version)}
			<LineEdit
				label={translate('display_item.title')}
				description={translate('display_item.description')}
				bind:value={displayItem}
				required
			></LineEdit>
		{/if}
	{/if}
</div>

<style>
	.dialog-page-container {
		overflow-y: auto;
		max-height: 75vh;
		padding-right: 16px;
		padding-left: 2px;
	}
</style>
