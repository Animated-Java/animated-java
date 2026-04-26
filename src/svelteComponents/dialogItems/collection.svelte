<script lang="ts" module>
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action'
	import { type Observable } from 'svelte-observable-store'
	import { flip } from 'svelte/animate'
	import { cubicIn } from 'svelte/easing'
	import { fade } from 'svelte/transition'
	import BaseDialogItem from './baseDialogItem.svelte'
</script>

<script lang="ts">
	interface Props {
		// An editable list of unique items, with a button to add new items from a list of options.
		label: string
		tooltip: string
		availableItemsColumnLable: string
		availableItemsColumnTooltip: string
		includedItemsColumnLable: string
		includedItemsColumnTooltip: string
		swapColumnsButtonTooltip: string
		availableItems: CollectionItem[]
		includedItems: Observable<CollectionItem[]>
	}

	let {
		label,
		tooltip,
		availableItemsColumnLable,
		availableItemsColumnTooltip,
		includedItemsColumnLable,
		includedItemsColumnTooltip,
		swapColumnsButtonTooltip,
		availableItems,
		includedItems = $bindable(),
	}: Props = $props()

	let availableItemsList = $derived.by(() => {
		let result: Array<{ id: number; title: string; [key: string]: any }> = []
		for (const item of availableItems) {
			if ($includedItems.find(i => i.value === item.value)) continue
			result.push({ id: result.length, title: item.name, icon: item.icon })
		}
		return result
	})
	let includedItemsList = $derived.by(() => {
		let result: Array<{ id: number; title: string; [key: string]: any }> = []
		for (const item of $includedItems) {
			result.push({ id: result.length, title: item.name, icon: item.icon })
		}
		return result
	})

	function handleSortAvailableItems(e: any) {
		availableItemsList = e.detail.items
	}

	function handleSortIncludedItems(e: any) {
		includedItemsList = e.detail.items
	}

	function finalizeSort() {
		includedItems.update(() =>
			includedItemsList.map(i => availableItems.find(a => a.name === i.title)!)
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

<BaseDialogItem {label} {tooltip} {onReset}>
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
				onconsider={handleSortAvailableItems}
				onfinalize={e => {
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
							style="color: rgb(162, 235, 255);">{item.icon ?? 'folder'}</i
						>
						<span>{item.title}</span>
					</div>
				{/each}
			</section>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<i
			class="fa-icon fas fa-arrow-right-arrow-left icon in_list_button"
			style="min-width: 30px;"
			title={swapColumnsButtonTooltip}
			onclick={swapColumns}
		></i>
		<div class="column selected-column" title={includedItemsColumnTooltip}>
			<h3>{includedItemsColumnLable}</h3>
			<section
				class="column sub-column-container"
				use:dndzone={{
					items: includedItemsList,
					flipDurationMs: 150,
					centreDraggedOnCursor: true,
				}}
				onconsider={handleSortIncludedItems}
				onfinalize={e => {
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
							style="color: rgb(162, 235, 255);">{item.icon ?? 'folder'}</i
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
		padding: 6px 8px 30px;
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
