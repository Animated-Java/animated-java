<script lang="ts" context="module">
	import type { Writable } from 'svelte/store'

	import Checkbox from './dialog_items/checkbox.svelte'
	import Number from './dialog_items/number.svelte'
	import LineInput from './dialog_items/lineInput.svelte'
	import Vector2D from './dialog_items/vector2d.svelte'
</script>

<script lang="ts">
	export let projectName: Writable<string>
	export let textureSizeX: Writable<number>
	export let textureSizeY: Writable<number>
</script>

<div>
	<LineInput label="Project Name:" bind:value={$projectName} />
	<Vector2D
		label="Texture Size:"
		valueX={$textureSizeX}
		minX={2}
		maxX={4096}
		valueY={$textureSizeY}
		minY={2}
		maxY={4096}
	/>
</div>
