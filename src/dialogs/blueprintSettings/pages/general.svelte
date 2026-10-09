<script lang="ts">
	import type {} from '@blockbench-types/generated/uv/uv_size'
	import { onDestroy } from 'svelte'
	import DataPackIcon from '../../../assets/icons/command_block.webp'
	import PluginIcon from '../../../assets/icons/papermc.svg'
	import { getDefaultProjectSettings } from '../../../formats/blueprint'
	import {
		validateBlueprintId,
		validateTargetMinecraftVersion,
		validateTextureSize,
	} from '../../../formats/blueprint/settings'
	import BoxSelect from '../../../svelteComponents/sidebarDialogItems/boxSelect.svelte'
	import LineEdit from '../../../svelteComponents/sidebarDialogItems/lineEdit.svelte'
	import Vector2 from '../../../svelteComponents/sidebarDialogItems/vector2.svelte'
	import { createScopedTranslator } from '../../../util/lang'

	const translate = createScopedTranslator('dialog.blueprint_settings')

	const DEFAULT_SETTINGS = getDefaultProjectSettings()

	let targetEnvironment = $state(Project.animated_java.enable_plugin_mode ? 'plugin' : 'datapack')
	let blueprintName = $state(Project.name)
	let blueprintId = $state(Project.animated_java.blueprint_id)
	let targetMinecraftVersion = $state(Project.animated_java.target_minecraft_version)
	let textureSizeX = $state(Project.texture_width)
	let textureSizeY = $state(Project.texture_height)

	$effect(() => {
		Project.pluginMode.set(targetEnvironment === 'plugin')
	})

	onDestroy(() => {
		UVSizeUtil.adjustProjectResolution(textureSizeX, textureSizeY)
		Project.name = blueprintName
		Project.animated_java.blueprint_id = blueprintId
		Project.animated_java.target_minecraft_version = targetMinecraftVersion
		Project.animated_java.enable_plugin_mode = targetEnvironment === 'plugin'
	})
</script>

<div class="dialog-page-container">
	<BoxSelect
		label={translate('target_environment.title')}
		description={translate('target_environment.description')}
		options={{
			datapack: {
				type: 'image',
				label: translate('target_environment.options.datapack'),
				src: DataPackIcon,
			},
			plugin: {
				type: 'image',
				label: translate('target_environment.options.plugin'),
				src: PluginIcon,
			},
		}}
		bind:selected={targetEnvironment}
	></BoxSelect>

	<LineEdit
		label={translate('blueprint_name.title')}
		description={translate('blueprint_name.description')}
		bind:value={blueprintName}
		defaultValue={'My Blueprint'}
	></LineEdit>

	<LineEdit
		label={translate('blueprint_id.title')}
		description={translate('blueprint_id.description')}
		bind:value={blueprintId}
		defaultValue={DEFAULT_SETTINGS.blueprint_id}
		checkValue={validateBlueprintId}
		required
	></LineEdit>

	<LineEdit
		label={translate('target_minecraft_version.title')}
		description={translate('target_minecraft_version.description')}
		bind:value={targetMinecraftVersion}
		defaultValue={DEFAULT_SETTINGS.target_minecraft_version}
		checkValue={validateTargetMinecraftVersion}
		required
	></LineEdit>

	<Vector2
		label={translate('texture_size.title')}
		description={translate('texture_size.description')}
		step={1}
		bind:valueX={textureSizeX}
		bind:valueY={textureSizeY}
		minX={1}
		minY={1}
		checkValue={validateTextureSize}
	></Vector2>
</div>

<style>
	.dialog-page-container {
		overflow-y: auto;
		max-height: 75vh;
		padding-right: 16px;
		padding-left: 2px;
	}
</style>
