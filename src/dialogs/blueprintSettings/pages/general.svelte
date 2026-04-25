<script lang="ts">
	import type {} from '@blockbench-types/generated/uv/uv_size'
	import { onDestroy } from 'svelte'
	import DataPackIcon from '../../../assets/icons/impulse_command_block.png'
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
		label="Target Environment"
		description="What system you'll be using to animate your Blueprint in-game."
		options={{
			datapack: {
				type: 'image',
				label: 'Datapack',
				src: DataPackIcon,
			},
			plugin: {
				type: 'image',
				label: 'Plugin',
				src: PluginIcon,
			},
		}}
		bind:selected={targetEnvironment}
	></BoxSelect>

	<LineEdit
		label="Blueprint Name"
		description="The name of your Blueprint. Used for the exported file name and in-game display name."
		bind:value={blueprintName}
		defaultValue={'My Blueprint'}
	></LineEdit>

	<LineEdit
		label="Blueprint ID"
		description="The unique identifier for your Blueprint."
		bind:value={blueprintId}
		defaultValue={DEFAULT_SETTINGS.blueprint_id}
		checkValue={validateBlueprintId}
		required
	></LineEdit>

	<LineEdit
		label="Target Minecraft Version"
		description="The Minecraft version you're targeting. Affects which features you can use and how the export is structured."
		bind:value={targetMinecraftVersion}
		defaultValue={DEFAULT_SETTINGS.target_minecraft_version}
		checkValue={validateTargetMinecraftVersion}
		required
	></LineEdit>

	<Vector2
		label="Texture Size"
		description="The width and height of the texture used for the Blueprint's animations. Must be a power of 2."
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
