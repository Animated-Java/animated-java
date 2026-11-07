<script lang="ts">
	import type { LoadedCollection } from '../../collections'
	import { openCollectionFile } from '../../interface/animatedJavaBarItem'
	import { createScopedTranslator } from '../../util/lang'

	const translate = createScopedTranslator('dialog.blueprint_settings.collection')

	let { collection }: { collection: LoadedCollection } = $props()
</script>

<div class="collection-notice">
	<i class="material-icons">collections_bookmark</i>
	<span>{translate('managed', pathToName(collection.path, false))}</span>
	<button onclick={() => openCollectionFile(collection.path)}>{translate('open')}</button>
</div>

<style>
	.collection-notice {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: -16px 0 24px;
		padding: 8px;
		border-radius: 4px;
		background: var(--color-back);
	}

	.collection-notice span {
		flex-grow: 1;
		font-size: 0.9em;
	}

	button {
		min-width: auto;
		white-space: nowrap;
	}
</style>
