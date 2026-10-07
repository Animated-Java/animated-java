<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import Checkbox from '../../svelteComponents/dialogItems/checkbox.svelte'
	import LineInput from '../../svelteComponents/dialogItems/lineInput.svelte'
	import SlotTexturesEditor from '../../svelteComponents/slotTexturesEditor.svelte'
	import { localize as translate } from '../../util/lang'
	import { Variant } from '../../variants'
</script>

<script lang="ts">
	import { observable } from 'svelte-observable-store'
	import CodeInput from '../../svelteComponents/dialogItems/codeInput.svelte'
	import Collection from '../../svelteComponents/dialogItems/collection.svelte'
	import {
		fromCollectionItems,
		getAvailableNodes,
		toCollectionItems,
	} from '../../util/excludedNodes'

	export let variant: Variant
	export let displayName: Observable<string>
	export let name: Observable<string>
	export let uuid: Observable<string>
	export let slotTextures: Map<string, string>
	export let generateNameFromDisplayName: Observable<boolean>
	export let excludedNodes: Observable<string[]>
	export let onApplyFunction: Observable<string>

	// `variant.excludedNodes` is stored as a Set of node UUIDs, but the Collection
	// component works in `CollectionItem`s. Bridge the two with a local store that
	// writes the UUIDs back into the dialog's observable on every change.
	let excludedNodeItems = observable(toCollectionItems(excludedNodes.get()))
	excludedNodeItems.subscribe(items => excludedNodes.set(fromCollectionItems(items)))

	const AVAILABLE_BONES = getAvailableNodes(excludedNodeItems.get(), {
		groupsOnly: true,
		excludeEmptyGroups: true,
	})

	let slotTextureRecord = Object.fromEntries(slotTextures)

	displayName.subscribe(value => {
		if ($generateNameFromDisplayName) {
			name.set(Variant.makeNameUnique(variant, value))
		}
	})

	generateNameFromDisplayName.subscribe(value => {
		if (!value) return
		name.set(Variant.makeNameUnique(variant, $displayName))
	})

	function setSlotTextures(value: Record<string, string>) {
		slotTextureRecord = value
		slotTextures.clear()
		for (const [slotUuid, textureUuid] of Object.entries(value)) {
			slotTextures.set(slotUuid, textureUuid)
		}
	}
</script>

<div class="dialog-container">
	<LineInput
		label={translate('dialog.variant_config.variant_display_name')}
		bind:value={displayName}
		tooltip={translate('dialog.variant_config.variant_display_name.description')}
		defaultValue={'New Variant'}
	/>

	{#key $name}
		{#if $generateNameFromDisplayName}
			<LineInput
				label={translate('dialog.variant_config.variant_name')}
				bind:value={name}
				tooltip={translate('dialog.variant_config.variant_name.description')}
				disabled
				defaultValue={'new_variant'}
			/>
		{:else}
			<LineInput
				label={translate('dialog.variant_config.variant_name')}
				bind:value={name}
				tooltip={translate('dialog.variant_config.variant_name.description')}
				defaultValue={'new_variant'}
			/>
		{/if}
	{/key}

	<Checkbox
		label={translate('dialog.variant_config.generate_name_from_display_name')}
		bind:checked={generateNameFromDisplayName}
		tooltip={translate('dialog.variant_config.generate_name_from_display_name.description')}
		defaultValue={true}
	/>

	{#if !variant.isDefault}
		<SlotTexturesEditor
			title={translate('dialog.variant_config.slot_textures.title')}
			description={translate('dialog.variant_config.slot_textures.description')}
			emptyText={translate('dialog.variant_config.slot_textures.no_slots')}
			value={slotTextureRecord}
			onchange={setSlotTextures}
		/>

		<Collection
			label={translate('dialog.variant_config.excluded_nodes.title')}
			tooltip={translate('dialog.variant_config.bone_lists.description')}
			availableItemsColumnLable={translate('dialog.variant_config.included_nodes.title')}
			availableItemsColumnTooltip={translate(
				'dialog.variant_config.included_nodes.description'
			)}
			includedItemsColumnLable={translate('dialog.variant_config.excluded_nodes.title')}
			includedItemsColumnTooltip={translate(
				'dialog.variant_config.excluded_nodes.description'
			)}
			swapColumnsButtonTooltip={translate(
				'dialog.variant_config.swap_columns_button.tooltip'
			)}
			availableItems={AVAILABLE_BONES}
			bind:includedItems={excludedNodeItems}
		/>
	{/if}

	<CodeInput
		label={translate('dialog.variant_config.on_apply_function.title')}
		bind:value={onApplyFunction}
		tooltip={translate('dialog.variant_config.on_apply_function.description')}
		syntax="mcfunction"
		defaultValue={''}
	></CodeInput>

	<div class="uuid">
		{$uuid}
	</div>
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		max-height: 75vh;
	}
	.uuid {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
		font-size: 14px;
		user-select: all;
	}
</style>
