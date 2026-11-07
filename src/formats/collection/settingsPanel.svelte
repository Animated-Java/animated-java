<script lang="ts" module>
	import type { CollectionExportMode, CollectionSettings } from '../../collections/collectionFile'
	import { resolveFrom } from '../../collections/collectionFile'
	import {
		validateDataPackFolder,
		validateResourcePackFolder,
		validateTargetMinecraftVersion,
		validateZipPath,
	} from '../../formats/blueprint/settings'
	import LineEdit from '../../svelteComponents/sidebarDialogItems/lineEdit.svelte'
	import SelectFile from '../../svelteComponents/sidebarDialogItems/selectFile.svelte'
	import SelectFolder from '../../svelteComponents/sidebarDialogItems/selectFolder.svelte'
	import type { ValueCheckResult } from '../../svelteComponents/sidebarDialogItems/sidebarDialogTypes'
	import EVENTS from '../../util/events'
	import { isRelativePath } from '../../util/fileUtil'
	import { createScopedTranslator } from '../../util/lang'
	import { editCollection } from '.'

	const localize = createScopedTranslator('collection.page')
	const settingsLocalize = createScopedTranslator('dialog.blueprint_settings')

	type PackKind = 'resource_pack' | 'data_pack'

	const EXPORT_MODES: CollectionExportMode[] = ['folder', 'zip', 'none']
</script>

<script lang="ts">
	import { onDestroy } from 'svelte'

	let project = $state<ModelProject>()
	let settings = $state<CollectionSettings>()

	function load(next: ModelProject | undefined) {
		project = next
		settings = next ? { ...next.collection!.settings } : undefined
	}
	load(Project?.collection ? Project : undefined)

	const unsubscribers = [
		EVENTS.SELECT_PROJECT.subscribe(selected =>
			load(selected.collection ? selected : undefined)
		),
		// A new tab is selected before its collection state is set, which announces itself here.
		EVENTS.UPDATE_COLLECTION.subscribe(changed => {
			if (changed === Project) load(changed)
		}),
	]
	onDestroy(() => unsubscribers.forEach(unsubscribe => unsubscribe()))

	$effect(() => {
		if (!project || !settings) return
		const next = $state.snapshot(settings)
		if (JSON.stringify(next) === JSON.stringify(project.collection!.settings)) return
		editCollection(project, state => (state.settings = next))
	})

	/** Relative pack paths resolve against the collection file, which a new collection lacks. */
	function fromCollection(validate: (value: string) => ValueCheckResult) {
		return (value: string): ValueCheckResult => {
			const savePath = project?.save_path
			if (value === '') return validate(value)
			if (!savePath && isRelativePath(value)) {
				return { type: 'warning', message: localize('relative_path_unsaved') }
			}
			return validate(savePath ? resolveFrom(savePath, value) : value)
		}
	}
</script>

{#snippet pack(kind: PackKind)}
	{@const validateFolder =
		kind === 'resource_pack' ? validateResourcePackFolder : validateDataPackFolder}
	<div class="pack-mode">
		<h3>{localize(`settings.${kind}`)}</h3>
		<ul
			class="form_inline_select"
			role="radiogroup"
			aria-label={settingsLocalize(`${kind}_export_mode.title`)}
		>
			{#each EXPORT_MODES as mode}
				{@const selected = settings![`${kind}_export_mode`] === mode}
				{@const select = () => (settings![`${kind}_export_mode`] = mode)}
				<!-- Blockbench's inline select is a list; the roles make it read as radio buttons. -->
				<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
				<li
					class:selected
					role="radio"
					aria-checked={selected}
					tabindex="0"
					onclick={select}
					onkeydown={event => (event.key === 'Enter' || event.key === ' ') && select()}
				>
					{settingsLocalize(`${kind}_export_mode.options.${mode}.title`)}
				</li>
			{/each}
		</ul>
	</div>
	{#if settings![`${kind}_export_mode`] === 'folder'}
		<SelectFolder
			label={settingsLocalize(`${kind}.folder.title`)}
			bind:value={settings![kind]}
			checkValue={fromCollection(validateFolder)}
			required
		></SelectFolder>
	{:else if settings![`${kind}_export_mode`] === 'zip'}
		<SelectFile
			label={settingsLocalize(`${kind}.zip.title`)}
			bind:value={settings![kind]}
			checkValue={fromCollection(validateZipPath)}
			required
		></SelectFile>
	{/if}
{/snippet}

<div class="collection-settings">
	{#if project && settings}
		{#key project}
			<LineEdit
				label={settingsLocalize('target_minecraft_version.title')}
				bind:value={settings.target_minecraft_version}
				checkValue={validateTargetMinecraftVersion}
				required
			></LineEdit>
			{@render pack('resource_pack')}
			{@render pack('data_pack')}
			<p class="hint">{localize('settings.relative_paths')}</p>
		{/key}
	{/if}
</div>

<style>
	.collection-settings {
		padding: 4px 10px 10px;
		/* Field error popups sit at z-index -1, which would put them behind the panel. */
		isolation: isolate;
	}

	.pack-mode {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 8px;
	}

	h3 {
		margin: 0 0 4px;
		font-size: 1em;
	}

	.hint {
		margin: 0;
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
</style>
