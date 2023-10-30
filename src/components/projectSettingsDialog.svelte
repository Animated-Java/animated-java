<script lang="ts" context="module">
	import type { Writable } from 'svelte/store'
	import { toSafeFuntionName } from '../minecraft'

	import Checkbox from './dialog_items/checkbox.svelte'
	import NumberSlider from './dialog_items/numberSlider.svelte'
	import LineInput from './dialog_items/lineInput.svelte'
	import Vector2D from './dialog_items/vector2d.svelte'
	import Select from './dialog_items/select.svelte'
	import SectionHeader from './dialog_items/sectionHeader.svelte'
</script>

<script lang="ts">
	import FileSelect from './dialog_items/fileSelect.svelte'

	export let blueprintName: Writable<string>
	export let exportNamespace: Writable<string>
	export let textureSizeX: Writable<number>
	export let textureSizeY: Writable<number>
	export let exportMode: Writable<string>
	// Resource Pack Settings
	export let displayItem: Writable<string>
	export let enableAdvancedResourcePackSettings: Writable<boolean>
	export let resourcePack: Writable<string>
	// Data Pack Settings
	export let enableAdvancedDataPackSettings: Writable<boolean>
	export let dataPack: Writable<string>

	function assertProjectName(name: string) {
		if (!name) {
			return 'Untitled Blueprint'
		}
		return name
	}

	function assertExportNamespace(name: string) {
		if (!name) {
			return 'untitled_blueprint'
		}
		return toSafeFuntionName(name)
	}

	function assertDisplayItem(name: string) {
		if (!name) {
			return 'minecraft:white_dye'
		}
		return name
	}
</script>

<div>
	<LineInput
		label="Blueprint Name"
		tooltip="The name of the project. Used to identify the project."
		bind:value={$blueprintName}
		valueValidator={assertProjectName}
	/>

	<LineInput
		label="Export Namespace"
		tooltip="The namespace of the project. This will be used as the namespace of the resource pack and data pack."
		bind:value={$exportNamespace}
		valueValidator={assertExportNamespace}
	/>

	<Vector2D
		label="Texture Size"
		tooltip="The size of the texture in pixels. This should be a power of 2, and ideally both X and Y should be the same."
		bind:valueX={$textureSizeX}
		minX={2}
		maxX={4096}
		bind:valueY={$textureSizeY}
		minY={2}
		maxY={4096}
	/>

	<Select
		label="Export Mode"
		tooltip="Whether to export a data pack, a resource pack, or both."
		options={{
			datapack_and_resourcepack: 'Data Pack & Resource Pack',
			datapack: 'Data Pack Only',
			resourcepack: 'Resource Pack Only',
		}}
		defaultOption="datapack_and_resourcepack"
		bind:value={$exportMode}
	/>

	{#if $exportMode !== 'datapack'}
		<SectionHeader label="Resource Pack" />
		<Checkbox
			label="Enable Advanced Resource Pack Settings?"
			bind:checked={$enableAdvancedResourcePackSettings}
		/>
		<LineInput
			label="Display Item"
			tooltip="The item to use to display the blueprint's models in-game."
			bind:value={$displayItem}
			valueValidator={assertDisplayItem}
		/>
		{#if $enableAdvancedResourcePackSettings}
			<!--  -->
		{:else}
			<FileSelect
				label="Resource Pack"
				tooltip="The pack.mcmeta of the Resource Pack to export to."
				bind:value={$resourcePack}
			/>
		{/if}
	{/if}

	{#if $exportMode !== 'resourcepack'}
		<SectionHeader label="Data Pack" />
		<Checkbox
			label="Enable Advanced Data Pack Settings?"
			bind:checked={$enableAdvancedDataPackSettings}
		/>
		{#if $enableAdvancedDataPackSettings}
			<!--  -->
		{:else}
			<FileSelect
				label="Data Pack"
				tooltip="The pack.mcmeta of the Data Pack to export to."
				bind:value={$dataPack}
			/>
		{/if}
	{/if}
</div>
