<script lang="ts">
	import { onDestroy } from 'svelte'
	import { validatePreviewResourcePack } from '../../../formats/blueprint/settings'
	import type { ValueCheckResult } from '../../../svelteComponents/sidebarDialogItems/sidebarDialogTypes'
	import {
		applyPreviewResourcePack,
		reloadPreviewResourcePack,
	} from '../../../systems/minecraft/previewResourcePack'
	import { createScopedTranslator } from '../../../util/lang'

	const translate = createScopedTranslator('dialog.blueprint_settings')

	let packs = $state<string[]>([...Project.animated_java.preview_resource_packs])

	let checks = $state<Array<ValueCheckResult | undefined>>([])
	$effect(() => {
		checks = packs.map(p => validatePreviewResourcePack(p))
	})

	function save() {
		Project.animated_java.preview_resource_packs = packs.map(p => p.trim()).filter(Boolean)
	}

	function addPack() {
		packs.push('')
	}

	function removePack(index: number) {
		packs.splice(index, 1)
	}

	function movePack(index: number, delta: number) {
		const target = index + delta
		if (target < 0 || target >= packs.length) return
		;[packs[index], packs[target]] = [packs[target], packs[index]]
	}

	function browseFolder(index: number) {
		const result = Filesystem.pickDirectory({
			title: 'Select Resource Pack Folder',
			startpath: packs[index],
			resource_id: 'animated_java:preview_resource_pack_folder',
		})
		if (result) packs[index] = result
	}

	function browseZip(index: number) {
		Filesystem.importFile(
			{
				title: 'Select Resource Pack Zip',
				startpath: packs[index],
				type: 'zip',
				extensions: ['zip'],
				readtype: 'none',
				resource_id: 'animated_java:preview_resource_pack_zip',
			},
			files => {
				if (files.length > 0) packs[index] = files[0].path
			}
		)
	}

	onDestroy(() => {
		save()
		void applyPreviewResourcePack()
	})
</script>

<div class="dialog-page-container">
	<div class="list-header">
		<span class="list-title">{translate('preview.list.title')}</span>
		<button onclick={addPack}>
			<i class="fa fa-plus"></i>
			{translate('preview.list.add')}
		</button>
	</div>
	<div class="list-hint">{@html translate('preview.list.hint')}</div>

	{#if packs.length === 0}
		<p class="empty-state">{translate('preview.list.empty')}</p>
	{:else}
		<div class="pack-list">
			{#each packs as _, index (index)}
				<div class="pack-row">
					<div class="pack-fields">
						<span class="priority">{index + 1}</span>
						<div class="input-wrap">
							<input
								type="text"
								class={checks[index]?.type ?? ''}
								placeholder={translate('preview.list.placeholder')}
								bind:value={packs[index]}
							/>
							<i
								class="fa fa-file-zipper"
								title={translate('preview.list.browse_zip')}
								onclick={() => browseZip(index)}
							></i>
							<i
								class="fa fa-folder"
								title={translate('preview.list.browse_folder')}
								onclick={() => browseFolder(index)}
							></i>
						</div>
						<div class="pack-actions">
							<i
								class="fa fa-chevron-up {index === 0 ? 'disabled' : ''}"
								title={translate('preview.list.move_up')}
								onclick={() => movePack(index, -1)}
							></i>
							<i
								class="fa fa-chevron-down {index === packs.length - 1
									? 'disabled'
									: ''}"
								title={translate('preview.list.move_down')}
								onclick={() => movePack(index, 1)}
							></i>
							<i
								class="fa fa-trash-can"
								title={translate('preview.list.remove')}
								onclick={() => removePack(index)}
							></i>
						</div>
					</div>
					{#if checks[index]}
						<div class="row-message {checks[index]?.type}">
							{@html checks[index]?.message}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if packs.some(p => p.trim() !== '')}
		<button
			class="reload-button"
			onclick={() => {
				save()
				void reloadPreviewResourcePack()
			}}
		>
			<i class="fa fa-arrows-rotate"></i>
			{translate('preview.reload')}
		</button>
	{/if}
</div>

<style>
	.dialog-page-container {
		overflow-y: auto;
		max-height: 75vh;
		padding-right: 16px;
		padding-left: 2px;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.list-title {
		font-size: 1.2em;
	}

	.list-header button {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.list-hint {
		color: var(--color-subtle_text);
		font-size: 0.95em;
		margin: 4px 0 12px;
	}

	.empty-state {
		color: var(--color-subtle_text);
		margin: 8px 0 16px;
	}

	.pack-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.pack-fields {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.priority {
		min-width: 20px;
		text-align: center;
		color: var(--color-subtle_text);
	}

	.input-wrap {
		position: relative;
		flex-grow: 1;
	}

	.input-wrap input {
		width: 100%;
		background-color: var(--color-back);
		outline: 1px solid var(--color-border);
		padding-left: 4px;
		padding-right: 44px;
		border-radius: 0;
	}

	.input-wrap input.error {
		outline: 2px solid var(--color-error);
	}

	.input-wrap input.warning {
		outline: 2px solid var(--color-warning);
	}

	.input-wrap i {
		position: absolute;
		top: 4px;
		cursor: pointer;
	}

	.input-wrap .fa-file-zipper {
		right: 24px;
	}

	.input-wrap .fa-folder {
		right: 4px;
	}

	.pack-actions {
		display: flex;
		gap: 8px;
	}

	.pack-actions i {
		cursor: pointer;
		padding: 2px;
	}

	.pack-actions i:hover {
		color: var(--color-light);
	}

	.pack-actions i.disabled {
		opacity: 0.3;
		pointer-events: none;
	}

	.row-message {
		margin: 4px 0 0 28px;
		font-size: 0.95em;
	}

	.row-message.error {
		color: var(--color-error);
	}

	.row-message.warning {
		color: var(--color-warning);
	}

	.reload-button {
		display: flex;
		align-items: center;
		gap: 6px;
	}
</style>
