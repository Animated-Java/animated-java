<script lang="ts">
	import BoxSelect from '../../../svelteComponents/sidebarDialogItems/boxSelect.svelte'
	import CodeEdit from '../../../svelteComponents/sidebarDialogItems/codeEdit.svelte'
	import SelectFile from '../../../svelteComponents/sidebarDialogItems/selectFile.svelte'
	import SelectFolder from '../../../svelteComponents/sidebarDialogItems/selectFolder.svelte'
	import { createScopedTranslator } from '../../../util/lang'
	import { validateDataPackFolder, validateZipPath } from '../blueprintSettings'

	const translate = createScopedTranslator('dialog.blueprint_settings')

	let dataPackExportFormat = $state(Project.animated_java.data_pack_export_mode)
	let dataPackLocation = $state(Project.animated_java.data_pack)
	let animationSystem = $state(
		Project.animated_java.use_storage_for_animation ? 'storage' : 'functions'
	)
	let onSummonFunction = $state(Project.animated_java.on_summon_function)
	let onRemoveFunction = $state(Project.animated_java.on_remove_function)
	let onPreTickFunction = $state(Project.animated_java.on_pre_tick_function)
	let onPostTickFunction = $state(Project.animated_java.on_post_tick_function)

	$effect(() => {
		Project.animated_java.data_pack_export_mode = dataPackExportFormat
		Project.animated_java.data_pack = dataPackLocation
		Project.animated_java.use_storage_for_animation = animationSystem === 'storage'
		Project.animated_java.on_summon_function = onSummonFunction
	})
</script>

<BoxSelect
	label="Data Pack Export Format"
	options={{
		folder: {
			type: 'text',
			label: 'Folder',
			description:
				'Export the Data Pack as a folder and automatically merge with existing files.',
		},
		zip: {
			type: 'text',
			label: 'Zip',
			description: 'Export the Data Pack as a `.zip` file.',
		},
		none: {
			type: 'text',
			label: 'None',
			description: "Don't export a Data Pack.",
		},
	}}
	bind:selected={dataPackExportFormat}
></BoxSelect>

{#if dataPackExportFormat === 'folder'}
	<SelectFolder
		label="Data Pack Folder"
		description="The folder to export the Data Pack to."
		bind:value={dataPackLocation}
		checkValue={validateDataPackFolder}
		required
	></SelectFolder>
{:else if dataPackExportFormat === 'zip'}
	<SelectFile
		label="Data Pack Zip"
		description="The location to export the Data Pack zip file to."
		bind:value={dataPackLocation}
		checkValue={validateZipPath}
		required
	></SelectFile>
{/if}

{#if dataPackExportFormat !== 'none'}
	<CodeEdit
		label={translate('on_summon_function.title')}
		description={translate('on_summon_function.description')}
		syntax="mcfunction"
		bind:value={onSummonFunction}
	></CodeEdit>

	<CodeEdit
		label={translate('on_remove_function.title')}
		description={translate('on_remove_function.description')}
		syntax="mcfunction"
		bind:value={onRemoveFunction}
	></CodeEdit>

	<CodeEdit
		label={translate('on_pre_tick_function.title')}
		description={translate('on_pre_tick_function.description')}
		syntax="mcfunction"
		bind:value={onPreTickFunction}
	></CodeEdit>

	<CodeEdit
		label={translate('on_post_tick_function.title')}
		description={translate('on_post_tick_function.description')}
		syntax="mcfunction"
		bind:value={onPostTickFunction}
	></CodeEdit>

	<BoxSelect
		label="Animation System"
		description="How to store animation data."
		options={{
			functions: {
				type: 'text',
				label: 'Functions',
				description:
					'Store animation data in function files. Best performance, but creates a lot of files.',
			},
			storage: {
				type: 'text',
				label: 'Storage',
				description:
					'Store animation data in command storage. Slower, but creates fewer files.',
			},
		}}
		bind:selected={animationSystem}
	></BoxSelect>
{/if}
