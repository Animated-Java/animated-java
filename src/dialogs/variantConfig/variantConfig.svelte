<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import MissingTexture from '../../assets/missing_texture.png'
	import Checkbox from '../../svelteComponents/dialogItems/checkbox.svelte'
	import LineInput from '../../svelteComponents/dialogItems/lineInput.svelte'
	import {
		getSlotDefaultTexture,
		getSlotTextures,
		getTextureSlot,
		getTextureSlots,
	} from '../../textureSlots'
	import { localize as translate } from '../../util/lang'
	import { Variant } from '../../variants'
</script>

<script lang="ts">
	import { observable } from 'svelte-observable-store'
	import CodeInput from '../../svelteComponents/dialogItems/codeInput.svelte'
	import Collection from '../../svelteComponents/dialogItems/collection.svelte'
	import TextureSelect from '../../svelteComponents/textureSelect.svelte'
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

	let slotTexturesUpdated = 0

	displayName.subscribe(value => {
		if ($generateNameFromDisplayName) {
			name.set(Variant.makeNameUnique(variant, value))
		}
	})

	generateNameFromDisplayName.subscribe(value => {
		if (!value) return
		name.set(Variant.makeNameUnique(variant, $displayName))
	})

	function openAddSlotMenu(e: MouseEvent) {
		const available = getTextureSlots().filter(
			slot => !slotTextures.has(slot.uuid) && getSlotDefaultTexture(slot)
		)
		if (!available.length) {
			Blockbench.showQuickMessage(
				translate('dialog.variant_config.slot_textures.all_slots_added')
			)
			return
		}
		new Menu(
			available.map(slot => ({
				name: slot.name,
				icon: 'style',
				click: () => {
					slotTextures.set(slot.uuid, getSlotDefaultTexture(slot)!.uuid)
					slotTexturesUpdated++
				},
			}))
		).open(e)
	}

	function setSlotTexture(slotUuid: string, textureUuid: string) {
		slotTextures.set(slotUuid, textureUuid)
		slotTexturesUpdated++
	}

	function removeSlot(slotUuid: string) {
		slotTextures.delete(slotUuid)
		slotTexturesUpdated++
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
		<div class="toolbar" style="margin: 8px 16px 8px; width: -webkit-fill-available;">
			<div>
				{translate('dialog.variant_config.slot_textures.title')}
			</div>
			<div class="spacer"></div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="tool"
				title={translate('dialog.variant_config.slot_textures.add_slot')}
				onclick={e => openAddSlotMenu(e)}
			>
				<i class="material-icons icon">add</i>
			</div>
		</div>
		<div class="texture-map-description">
			{@html translate('dialog.variant_config.slot_textures.description')}
		</div>

		{#key slotTexturesUpdated}
			<ul class="texture-map-container">
				{#each [...slotTextures.entries()] as [slotUuid, textureUuid] (slotUuid)}
					{@const slot = getTextureSlot(slotUuid)}
					{#if slot}
						<li class="texture-mapping-item">
							<div class="slot-name">{slot.name}</div>

							<i class="material-icons icon">east</i>

							<TextureSelect
								textures={getSlotTextures(slot)}
								value={textureUuid}
								missingSrc={MissingTexture}
								onchange={uuid => setSlotTexture(slotUuid, uuid)}
							/>

							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<i
								class="material-icons icon tool trash"
								onclick={() => removeSlot(slotUuid)}>delete</i
							>
						</li>
					{/if}
				{:else}
					<div class="no-mappings">
						{translate('dialog.variant_config.slot_textures.no_slots')}
					</div>
				{/each}
			</ul>
		{/key}

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
	.no-mappings {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
	}
	.texture-mapping-item {
		display: grid;
		grid-template-columns: 1fr auto 1fr auto;
		align-items: center;
		gap: 16px;
		padding-right: 16px;
	}
	.slot-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.texture-map-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
		margin: 8px 16px 8px;
		margin-top: -4px;
		padding: 8px;
		gap: 8px;
		overflow-y: auto;
		max-height: 600px;
		min-height: fit-content;
		width: auto;
		background: var(--color-back);
		border-radius: 6px;
	}
	.spacer {
		flex-grow: 1;
	}
	.toolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	.texture-map-description {
		font-size: 0.9em;
		color: var(--color-subtle_text);
		margin-top: -6px;
		margin-bottom: 16px;
		max-width: 80%;
		margin-left: calc(16px + 0.75rem);
	}
	.trash {
		height: unset;
	}
</style>
