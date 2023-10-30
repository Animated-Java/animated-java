<script lang="ts" context="module">
	import type { Writable } from 'svelte/store'
	import { toSafeFuntionName } from '../minecraft'

	import Checkbox from './dialog_items/checkbox.svelte'
	import NumberSlider from './dialog_items/numberSlider.svelte'
	import LineInput from './dialog_items/lineInput.svelte'
	import Vector2D from './dialog_items/vector2d.svelte'
	import Select from './dialog_items/select.svelte'
</script>

<script lang="ts">
	export let projectName: Writable<string>
	export let textureSizeX: Writable<number>
	export let textureSizeY: Writable<number>
	export let exportMode: Writable<string>

	function assertProjectName(name: string) {
		if (name === '') {
			return 'untitled_project'
		}
		return toSafeFuntionName(name)
	}
</script>

<div>
	<LineInput
		label="Project Name"
		tooltip="The name of the project. This will be used as the namespace of the resource pack and data pack."
		bind:value={$projectName}
		valueValidator={assertProjectName}
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
</div>
