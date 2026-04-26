<script lang="ts">
	import { onDestroy } from 'svelte'
	import CodeEdit from '../../../svelteComponents/sidebarDialogItems/codeEdit.svelte'
	import { createScopedTranslator } from '../../../util/lang'

	const translate = createScopedTranslator('dialog.blueprint_settings')

	let onSummonFunction = $state(Project.animated_java.on_summon_function)
	let onRemoveFunction = $state(Project.animated_java.on_remove_function)
	let onPreTickFunction = $state(Project.animated_java.on_pre_tick_function)
	let onPostTickFunction = $state(Project.animated_java.on_post_tick_function)

	onDestroy(() => {
		Project.animated_java.on_summon_function = onSummonFunction
		Project.animated_java.on_remove_function = onRemoveFunction
		Project.animated_java.on_pre_tick_function = onPreTickFunction
		Project.animated_java.on_post_tick_function = onPostTickFunction
	})
</script>

<div class="dialog-page-container">
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
</div>

<style>
	.dialog-page-container {
		overflow-y: auto;
		max-height: 75vh;
		padding-right: 16px;
		padding-left: 2px;
	}
</style>
