<script lang="ts">
	import { onDestroy } from 'svelte'
	import Checkbox from '../../../svelteComponents/sidebarDialogItems/checkbox.svelte'
	import SelectFile from '../../../svelteComponents/sidebarDialogItems/selectFile.svelte'
	import { createScopedTranslator } from '../../../util/lang'

	const localize = createScopedTranslator('dialog.blueprint_settings')

	let bakedAnimations = $state(Project.animated_java.baked_animations)
	let jsonFile = $state(Project.animated_java.json_file)

	onDestroy(() => {
		Project.animated_java.baked_animations = bakedAnimations
		Project.animated_java.json_file = jsonFile
	})
</script>

<div class="dialog-page-container">
	<SelectFile
		label={localize('json_file.title')}
		description={localize('json_file.description')}
		extensions={['.json']}
		bind:value={jsonFile}
		required
	></SelectFile>

	<Checkbox
		label={localize('baked_animations.title')}
		description={localize('baked_animations.description')}
		bind:value={bakedAnimations}
	></Checkbox>
</div>

<style>
	.dialog-page-container {
		overflow-y: auto;
		max-height: 75vh;
		padding-right: 16px;
		padding-left: 2px;
	}
</style>
