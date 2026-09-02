<script lang="ts">
	import { onDestroy } from 'svelte'
	import Checkbox from '../../../svelteComponents/sidebarDialogItems/checkbox.svelte'
	import Vector2 from '../../../svelteComponents/sidebarDialogItems/vector2.svelte'
	import { createScopedTranslator } from '../../../util/lang'

	const translate = createScopedTranslator('dialog.blueprint_settings')

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
		label={translate('show_render_box.title')}
		description={translate('show_render_box.description')}
		bind:value={showRenderBox}
	></Checkbox>

	<Checkbox
		label={translate('auto_render_box.title')}
		description={translate('auto_render_box.description')}
		bind:value={autoRenderBox}
	></Checkbox>

	{#if !autoRenderBox}
		<Vector2
			label={translate('render_box.title')}
			description={translate('render_box.description')}
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
