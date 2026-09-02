<script lang="ts" module>
	import { type Observable } from 'svelte-observable-store'
	import MissingTexture from '../../assets/missing_texture.png'
	import Checkbox from '../../svelteComponents/dialogItems/checkbox.svelte'
	import LineInput from '../../svelteComponents/dialogItems/lineInput.svelte'
	import { localize as translate } from '../../util/lang'
	import { TextureMap, Variant } from '../../variants'
</script>

<script lang="ts">
	import CodeInput from '../../svelteComponents/dialogItems/codeInput.svelte'
	import Collection from '../../svelteComponents/dialogItems/collection.svelte'
	import TextureSelect from '../../svelteComponents/textureSelect.svelte'
	import { getAvailableNodes } from '../../util/excludedNodes'

	export let variant: Variant
	export let displayName: Observable<string>
	export let name: Observable<string>
	export let uuid: Observable<string>
	export let textureMap: TextureMap
	export let generateNameFromDisplayName: Observable<boolean>
	export let excludedNodes: Observable<CollectionItem[]>
	export let onApplyFunction: Observable<string>

	const AVAILABLE_TEXTURES = [...Texture.all]
	const PRIMARY_TEXTURES = [...Texture.all]
	const SECONDARY_TEXTURES = AVAILABLE_TEXTURES

	const AVAILABLE_BONES = getAvailableNodes(excludedNodes.get(), {
		groupsOnly: true,
		excludeEmptyGroups: true,
	})

	let textureMapUpdated = 0

	displayName.subscribe(value => {
		if ($generateNameFromDisplayName) {
			name.set(Variant.makeNameUnique(variant, value))
		}
	})

	generateNameFromDisplayName.subscribe(value => {
		if (!value) return
		name.set(Variant.makeNameUnique(variant, $displayName))
	})

	function createTextureMapping() {
		const texture = getUnusedPrimaryTextures()[0]
		if (!texture) return
		textureMap.add(texture.uuid, texture.uuid)
		textureMapUpdated++
	}

	function deleteTextureMapping(uuid: string) {
		textureMap.delete(uuid)
		textureMapUpdated++
	}

	function setPrimaryTexture(oldPrimaryUUID: string, newPrimaryUUID: string) {
		if (newPrimaryUUID === oldPrimaryUUID) return
		const secondaryUuid = textureMap.get(oldPrimaryUUID)
		if (!secondaryUuid) return
		textureMap.delete(oldPrimaryUUID)
		textureMap.add(newPrimaryUUID, secondaryUuid)
		textureMapUpdated++
	}

	function setSecondaryTexture(primaryUUID: string, newSecondaryUUID: string) {
		textureMap.add(primaryUUID, newSecondaryUUID)
		textureMapUpdated++
	}

	function getUnusedPrimaryTextures() {
		const usedTextures = [...textureMap.map.keys()]
		return PRIMARY_TEXTURES.filter(t => !usedTextures.includes(t.uuid))
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
		<div class="toolbar" style="margin: 8px 0;">
			<div>
				{translate('dialog.variant_config.texture_map.title')}
			</div>
			<div class="spacer"></div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="tool"
				title={translate('dialog.variant_config.texture_map.create_new_mapping')}
				onclick={() => createTextureMapping()}
			>
				<i class="material-icons icon">add</i>
			</div>
		</div>
		{#key textureMapUpdated}
			<ul
				class="texture-map-container"
				style={[...textureMap.map.entries()].length === 0 ? 'min-height: 2rem;' : ''}
			>
				{#each [...textureMap.map.entries()] as entry}
					<li class="texture-mapping-item">
						<TextureSelect
							textures={PRIMARY_TEXTURES}
							value={entry[0]}
							missingSrc={MissingTexture}
							onchange={uuid => setPrimaryTexture(entry[0], uuid)}
						/>

						<i class="material-icons icon">east</i>

						<TextureSelect
							textures={SECONDARY_TEXTURES}
							value={entry[1]}
							missingSrc={MissingTexture}
							onchange={uuid => setSecondaryTexture(entry[0], uuid)}
						/>

						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<i
							class="material-icons icon tool trash"
							onclick={() => deleteTextureMapping(entry[0])}>delete</i
						>
					</li>
				{:else}
					<div class="no-mappings">
						{translate('dialog.variant_config.texture_map.no_mappings')}
					</div>
				{/each}
			</ul>
		{/key}
		<div class="texture-map-description">
			{@html translate('dialog.variant_config.texture_map.description')}
		</div>

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
			bind:includedItems={excludedNodes}
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
		display: flex;
		align-items: center;
		gap: 16px;
		background-color: var(--color-back);
		padding: 8px;
	}
	.texture-map-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
		padding: 4px;
		gap: 4px;
		overflow-y: auto;
		max-height: 600px;
		min-height: fit-content;
		width: 100%;
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
		margin-top: 4px;
		margin-bottom: 16px;
		max-width: 80%;
	}
	.trash {
		height: unset;
	}
</style>
