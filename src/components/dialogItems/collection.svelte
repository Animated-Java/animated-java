<script lang="ts" context="module">
	import { Valuable } from '../../util/stores'
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action'
	import BaseDialogItem from './baseDialogItem.svelte'
	import { flip } from 'svelte/animate'
	import { fade } from 'svelte/transition'
	import { cubicIn } from 'svelte/easing'
</script>

<script lang="ts">
	// An editable list of unique items, with a button to add new items from a list of options.
	export let label: string
	export let tooltip: string
	export let availableItemsColumnLable: string
	export let availableItemsColumnTooltip: string
	export let includedItemsColumnLable: string
	export let includedItemsColumnTooltip: string
	export let swapColumnsButtonTooltip: string
	export let availableItems: CollectionItem[]
	export let includedItems: Valuable<Array<CollectionItem>>

	let includedItemsList: { id: number; title: string; [key: string]: any }[] = []
	let availableItemsList: { id: number; title: string; [key: string]: any }[] = []

	for (let i = 0; i < availableItems.length; i++) {
		const item = availableItems[i]
		if (includedItems.get().find(i => i.value === item.value)) {
			includedItemsList.push({ id: i, title: item.name, icon: item.icon })
		} else {
			availableItemsList.push({ id: i, title: item.name, icon: item.icon })
		}
	}

	function handleSortAvailableItems(e: any) {
		availableItemsList = e.detail.items
	}

	function handleSortIncludedItems(e: any) {
		includedItemsList = e.detail.items
	}

	function finalizeSort() {
		includedItems.update(items =>
			includedItemsList.map(i => availableItems.find(a => a.name === i.title)!),
		)
	}

	function swapColumns() {
		const temp = availableItemsList
		availableItemsList = includedItemsList
		includedItemsList = temp
		finalizeSort()
	}

	function onReset() {
		includedItems.set([])
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset} let:id>
	<div class="main-column-container">
		<div class="column" title={availableItemsColumnTooltip}>
			<h3>{availableItemsColumnLable}</h3>
			<section
				class="column sub-column-container"
				use:dndzone={{
					items: availableItemsList,
					flipDurationMs: 150,
					centreDraggedOnCursor: true,
				}}
				on:consider={handleSortAvailableItems}
				on:finalize={e => {
					handleSortAvailableItems(e)
					finalizeSort()
				}}
			>
				{#each availableItemsList as item (item.id)}
					<div class="list-item" animate:flip={{ duration: 150 }}>
						{#if item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
							<div
								style="visibility: visible !important; border-bottom: 2px solid var(--color-accent); width: 100%; height: 50%;"
								in:fade={{ duration: 150, easing: cubicIn }}
							></div>
						{/if}
						<i
							class="material-icons notranslate icon"
							style="color: rgb(162, 235, 255);">{item.icon || 'folder'}</i
						>
						<span>{item.title}</span>
					</div>
				{/each}
			</section>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<i
			class="fa-icon fas fa-arrow-right-arrow-left icon in_list_button"
			style="min-width: 30px;"
			title={swapColumnsButtonTooltip}
			on:click={swapColumns}
		/>
		<div class="column selected-column" title={includedItemsColumnTooltip}>
			<h3>{includedItemsColumnLable}</h3>
			<section
				class="column sub-column-container"
				use:dndzone={{
					items: includedItemsList,
					flipDurationMs: 150,
					centreDraggedOnCursor: true,
				}}
				on:consider={handleSortIncludedItems}
				on:finalize={e => {
					handleSortIncludedItems(e)
					finalizeSort()
				}}
			>
				{#each includedItemsList as item (item.id)}
					<div class="list-item" animate:flip={{ duration: 150 }}>
						{#if item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
							<div
								style="visibility: visible !important; border-bottom: 2px solid var(--color-accent); width: 100%; height: 50%;"
								in:fade={{ duration: 150, easing: cubicIn }}
							></div>
						{/if}
						<i
							class="material-icons notranslate icon"
							style="color: rgb(162, 235, 255);">{item.icon || 'folder'}</i
						>
						<span>{item.title}</span>
					</div>
				{/each}
			</section>
		</div>
	</div>
</BaseDialogItem>

<style>
	.main-column-container {
		display: flex;
		justify-content: space-around;
	}
	section.sub-column-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		width: unset;
		height: 100%;
		background-color: var(--color-back);
		border: 1px solid var(--color-border);
		margin: 8px;
		margin-top: 0px;
		padding: 4px 8px 30px;
		max-height: 16rem;
		overflow-y: auto;
	}
	h3 {
		text-align: center;
		font-size: 16px;
		padding: 0px;
		margin: 8px 0px;
	}
	.column {
		display: flex;
		flex-direction: column;
		width: 50%;
	}
	.list-item {
		display: flex;
		cursor: default !important;
		width: 100%;
	}
	span {
		/* background-color: var(--color-button); */
		/* border-bottom: 2px solid var(--color-dark); */
		/* margin: 0 8px 6px 8px; */
		padding: 0 8px;
	}
	span:hover {
		color: var(--color-light);
	}
	.fa-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-right: 8px;
		padding-left: 8px;
		margin-top: 68px;
	}
</style>
