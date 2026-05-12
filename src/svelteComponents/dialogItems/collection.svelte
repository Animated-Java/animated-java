<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
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

	function sortByName<T extends { name: string }>(items: T[]): T[] {
		return [...items].sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
		)
	}

	let availableItemsList = $derived.by(() => {
		let result: Array<{ id: string; title: string; value: string; icon?: string }> = []
		for (const item of sortByName(availableItems)) {
			if ($includedItems.find(i => i.value === item.value)) continue
			result.push({ id: item.value, title: item.name, value: item.value, icon: item.icon })
		}
		return result
	})
	let includedItemsList = $derived.by(() => {
		let result: Array<{ id: string; title: string; value: string; icon?: string }> = []
		for (const item of sortByName($includedItems)) {
			result.push({ id: item.value, title: item.name, value: item.value, icon: item.icon })
		}
		return result
	})

	function includeItem(value: string) {
		const itemToInclude = availableItems.find(item => item.value === value)
		if (!itemToInclude) return

		includedItems.update(items => {
			if (items.find(item => item.value === value)) return items
			return sortByName([...items, itemToInclude])
		})
	}

	function excludeItem(value: string) {
		includedItems.update(items => items.filter(item => item.value !== value))
	}

	function swapColumns() {
		includedItems.set(
			sortByName(
				availableItems.filter(item => !$includedItems.some(i => i.value === item.value))
			)
		)
	}

	function onReset() {
		includedItems.set([])
	}
</script>

<BaseDialogItem {label} {tooltip} {onReset}>
	<div class="main-column-container">
		<div class="column" title={availableItemsColumnTooltip}>
			<h3>{availableItemsColumnLable}</h3>
			<section class="column sub-column-container">
				{#each availableItemsList as item (item.id)}
					<div class="list-item">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<i
							class="fas fa-angle-right icon swap-item-button"
							title="Move to {includedItemsColumnLable}"
							onclick={() => includeItem(item.value)}
						></i>
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
			class="swap-icon fas fa-arrow-right-arrow-left icon in_list_button"
			style="min-width: 30px;"
			title={swapColumnsButtonTooltip}
			onclick={swapColumns}
		></i>
		<div class="column selected-column" title={includedItemsColumnTooltip}>
			<h3>{includedItemsColumnLable}</h3>
			<section class="column sub-column-container">
				{#each includedItemsList as item (item.id)}
					<div class="list-item">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<i
							class="fas fa-angle-left icon swap-item-button"
							title="Move to {availableItemsColumnLable}"
							onclick={() => excludeItem(item.value)}
						></i>
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
		align-items: center;
		gap: 8px;
		cursor: default !important;
		width: 100%;
	}
	span {
		flex: 1;
	}
	span:hover {
		color: var(--color-light);
	}
	.swap-item-button {
		font-size: 16px;
		line-height: 1;
		padding: 2px;
		color: var(--color-text);
		cursor: pointer;
	}
	.swap-item-button:hover {
		color: var(--color-light);
	}
	.swap-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-right: 8px;
		padding-left: 8px;
		margin-top: 68px;
	}
</style>
