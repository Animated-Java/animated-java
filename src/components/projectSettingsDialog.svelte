<script lang="ts" context="module">
	import { Valuable } from '../util/stores'

	import Checkbox from './dialog_items/checkbox.svelte'
	import NumberSlider from './dialog_items/numberSlider.svelte'
	import LineInput from './dialog_items/lineInput.svelte'
	import Vector2D from './dialog_items/vector2d.svelte'
	import Select from './dialog_items/select.svelte'
	import SectionHeader from './dialog_items/sectionHeader.svelte'
</script>

<script lang="ts">
	import FileSelect from './dialog_items/fileSelect.svelte'

	export let blueprintName: Valuable<string>
	export let exportNamespace: Valuable<string>
	export let textureSizeX: Valuable<number>
	export let textureSizeY: Valuable<number>
	// Resource Pack Settings
	export let exportResourcePack: Valuable<boolean>
	export let displayItem: Valuable<string>
	export let enableAdvancedResourcePackSettings: Valuable<boolean>
	export let resourcePack: Valuable<string>
	// Data Pack Settings
	export let exportDataPack: Valuable<boolean>
	export let enableAdvancedDataPackSettings: Valuable<boolean>
	export let dataPack: Valuable<string>
</script>

<div>
	<LineInput
		label="Blueprint Name"
		tooltip="The name of the project. Used to identify the project."
		bind:value={blueprintName}
	/>

	<LineInput
		label="Export Namespace"
		tooltip="The namespace of the project. This will be used as the namespace of the resource pack and data pack."
		bind:value={exportNamespace}
	/>

	<Vector2D
		label="Texture Size"
		tooltip="The size of the texture in pixels. This should be a power of 2, and ideally both X and Y should be the same."
		bind:valueX={textureSizeX}
		minX={2}
		maxX={4096}
		bind:valueY={textureSizeY}
		minY={2}
		maxY={4096}
	/>

	<Checkbox label="Export Resource Pack?" bind:checked={exportResourcePack} />
	<Checkbox label="Export Data Pack?" bind:checked={exportDataPack} />

	{#if $exportResourcePack}
		<SectionHeader label="Resource Pack Settings" />
		<Checkbox
			label="Enable Advanced Resource Pack Settings?"
			bind:checked={enableAdvancedResourcePackSettings}
		/>
		<LineInput
			label="Display Item"
			tooltip="The item to use to display the blueprint's models in-game."
			bind:value={displayItem}
		/>
		{#if $enableAdvancedResourcePackSettings}
			<!--  -->
		{:else}
			<FileSelect
				label="Resource Pack"
				tooltip="The pack.mcmeta of the Resource Pack to export to."
				bind:value={resourcePack}
			/>
		{/if}
	{/if}

	{#if $exportDataPack}
		<SectionHeader label="Data Pack Settings" />
		<Checkbox
			label="Enable Advanced Data Pack Settings?"
			bind:checked={enableAdvancedDataPackSettings}
		/>
		{#if $enableAdvancedDataPackSettings}
			<!--  -->
		{:else}
			<FileSelect
				label="Data Pack"
				tooltip="The pack.mcmeta of the Data Pack to export to."
				bind:value={dataPack}
			/>
		{/if}
	{/if}
</div>
