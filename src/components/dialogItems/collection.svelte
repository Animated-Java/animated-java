<script lang="ts" context="module">
	import { Valuable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import BaseDialogItem from './baseDialogItem.svelte'
</script>

<script lang="ts">
	// An editable list of unique items, with a button to add new items from a list of options.
	export let label: string
	export let tooltip: string = ''
	export let availableItems: CollectionItem[]
	export let includedItems: Valuable<Array<CollectionItem>>

	let selectedOption: Valuable<string> = new Valuable('')

	selectedOption.subscribe(value => {
		if (value) {
			const item = availableItems.find(i => i.name === value)
			if (item) {
				addItem(item)
			}
		}
		selectedOption.set('')
	})

	function hasItem(item: CollectionItem) {
		return includedItems.get().includes(item)
	}

	function addItem(item: CollectionItem) {
		includedItems.update(items => {
			if (items.includes(item)) {
				Blockbench.showQuickMessage('Cannot add the same item twice!')
				return items
			}
			return [...items, item]
		})
	}

	function removeItem(item: CollectionItem) {
		includedItems.update(items => items.filter(i => i !== item))
	}
</script>

<BaseDialogItem {tooltip}>
	<div class="dialog_bar form_bar dialog-item" style="margin-bottom: 2px;">
		<label class="name_space_left" for="export">{label}</label>
		<div class="spacer" />
		{#key $includedItems}
			{#if availableItems.allAre(i => hasItem(i))}
				<i
					class="fa-icon fas fa-xmark icon in_list_button"
					style="min-width: 30px;"
					title={translate('dialog.animation_properties.no_more_bones.description')}
				/>
			{:else}
				<i class="fa-icon fas fa-plus icon in_list_button" style="min-width: 30px;" />
			{/if}
			<select
				bind:value={$selectedOption}
				title={translate('dialog.animation_properties.add_bone.description')}
			>
				<option>{''}</option>
				{#each availableItems as item}
					{#if !hasItem(item)}
						<option>{item.name}</option>
					{/if}
				{/each}
			</select>
		{/key}
	</div>
	<ol>
		{#each $includedItems as item}
			<li>
				{item.name}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<i class="material-icons icon in_list_button" on:click={() => removeItem(item)}
					>delete</i
				>
			</li>
		{/each}
	</ol>
</BaseDialogItem>

<style>
	.dialog-item {
		display: flex;
		align-items: center;
	}
	.fa-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-right: 8px;
		padding-left: 8px;
	}
	.spacer {
		flex-grow: 1;
		border-bottom: 2px dashed var(--color-button);
		height: 0px;
		margin: 8px;
	}
	label {
		width: auto;
	}
	ol {
		max-height: 20rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-content: flex-end;
		flex-wrap: wrap;
		border-left: 2px solid var(--color-button);
		border-bottom: 2px solid var(--color-button);
		border-radius: 0 0 0 8px;
		margin-bottom: 2px;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-left: 8px;
		padding-right: 3px;
		background-color: var(--color-button);
		border-bottom: 2px solid var(--color-dark);
		margin-bottom: 6px;
		min-width: 11.7rem;
		max-width: 22rem;
	}
	select {
		all: unset;
		position: absolute;
		right: 0;
	}
</style>
