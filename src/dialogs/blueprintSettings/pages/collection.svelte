<script lang="ts">
	import {
		CollectionError,
		getLinkedCollection,
		getLinkedCollectionPath,
		leaveCollection,
		type LoadedCollection,
	} from '../../../collections'
	import { SHARED_SETTING_KEYS } from '../../../collections/collectionFile'
	import { openCollectionFile } from '../../../interface/animatedJavaBarItem'
	import { createScopedTranslator } from '../../../util/lang'

	const translate = createScopedTranslator('dialog.blueprint_settings')

	let linkPath = $state(getLinkedCollectionPath(Project))
	let collection = $state<LoadedCollection>()
	let error = $state<string>()

	function refresh() {
		linkPath = getLinkedCollectionPath(Project)
		collection = undefined
		error = undefined
		try {
			collection = getLinkedCollection(Project)
		} catch (e) {
			if (!(e instanceof CollectionError)) throw e
			error = e.message
		}
	}
	refresh()

	function leave() {
		try {
			leaveCollection(Project)
		} catch (e) {
			if (!(e instanceof CollectionError)) throw e
			error = e.message
			return
		}
		refresh()
	}
</script>

<div class="dialog-page-container">
	{#if !linkPath}
		<p>{translate('collection.not_linked')}</p>
	{:else}
		<h3>{pathToName(linkPath, false)}</h3>
		<p class="path">{linkPath}</p>

		{#if error}
			<p class="error">
				<i class="material-icons">warning</i>
				{translate('collection.broken', error)}
			</p>
		{:else if collection}
			<p>{translate('collection.description')}</p>
			<table>
				<tbody>
					{#each SHARED_SETTING_KEYS as key}
						<tr>
							<td>{translate(`collection.settings.${key}`)}</td>
							<td class="value">{collection.file.settings[key] || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		<div class="buttons">
			{#if collection}
				<button onclick={() => openCollectionFile(collection!.path)}>
					{translate('collection.open')}
				</button>
			{/if}
			<button onclick={leave}>{translate('collection.leave')}</button>
		</div>
	{/if}
</div>

<style>
	.dialog-page-container {
		overflow-y: auto;
		max-height: 75vh;
		padding-right: 16px;
		padding-left: 2px;
	}

	.path {
		margin-top: 0;
		word-break: break-all;
		color: var(--color-subtle_text);
	}

	.error {
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--color-warning);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	td {
		padding: 4px 8px;
		border-top: 1px solid var(--color-border);
	}

	.value {
		word-break: break-all;
		color: var(--color-subtle_text);
	}

	.buttons {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}
</style>
