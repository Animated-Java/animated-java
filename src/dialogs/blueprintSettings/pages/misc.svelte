<script lang="ts">
	import { onDestroy } from 'svelte'
	import Checkbox from '../../../svelteComponents/sidebarDialogItems/checkbox.svelte'
	import Vector2 from '../../../svelteComponents/sidebarDialogItems/vector2.svelte'

	let showRenderBox = $state(Project.animated_java.show_render_box)
	let autoRenderBox = $state(Project.animated_java.auto_render_box)
	let renderBoxSizeX = $state(Project.animated_java.render_box[0])
	let renderBoxSizeY = $state(Project.animated_java.render_box[1])

	onDestroy(() => {
		Project.animated_java.show_render_box = showRenderBox
		Project.animated_java.auto_render_box = autoRenderBox
		Project.animated_java.render_box = [renderBoxSizeX, renderBoxSizeY]
	})
</script>

<div class="dialog-page-container">
	<Checkbox
		label="Preview Render Box"
		description="Show a box in the preview that represents the rig's render box."
		bind:value={showRenderBox}
	></Checkbox>

	<Checkbox
		label="Auto Render Box"
		description="Automatically adjust the rig's render box to fit the model."
		bind:value={autoRenderBox}
	></Checkbox>

	{#if !autoRenderBox}
		<Vector2
			label="Render Box Size"
			description="The size of the rig's render box. This is ignored if Auto Render Box is enabled."
			step={1}
			bind:valueX={renderBoxSizeX}
			minX={1}
			bind:valueY={renderBoxSizeY}
			minY={1}
		></Vector2>
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
