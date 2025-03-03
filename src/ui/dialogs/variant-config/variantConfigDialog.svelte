<script lang="ts">
	import { type Syncable } from '@aj/util/stores'
	import { translate } from '@aj/util/translation'
	import { TextureMap, Variant } from '@aj/variants'
	import MissingTexture from '@assets/missing_texture.png'
	import Checkbox from '@svelte-components/dialog-items/checkbox.svelte'
	import Collection from '@svelte-components/dialog-items/collection.svelte'
	import LineInput from '@svelte-components/dialog-items/lineInput.svelte'
	import { getAvailableNodes } from '../../../util/excludedNodes'

	export let variant: Variant
	export let displayName: Syncable<string>
	export let name: Syncable<string>
	export let uuid: Syncable<string>
	export let textureMap: TextureMap
	export let generateNameFromDisplayName: Syncable<boolean>
	export let excludedNodes: Syncable<CollectionItem[]>

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

	function getTextureSrc(uuid: string) {
		const texture = AVAILABLE_TEXTURES.find(t => t.uuid === uuid)
		if (!texture) return MissingTexture
		return texture.img.src
	}

	function selectNewPrimaryTexture(e: Event, oldPrimaryUUID: string) {
		const select = e.target as HTMLSelectElement
		const textureName = select.value.trim()
		const newPrimaryUUID = PRIMARY_TEXTURES.find(t => t.name === textureName)?.uuid
		if (!newPrimaryUUID) {
			console.error(`Failed to find new primary texture with the name: ${textureName}`)
			return
		}
		const secondaryUuid = textureMap.get(oldPrimaryUUID)
		if (!secondaryUuid) {
			console.error(`Failed to find secondary texture with the uuid: ${oldPrimaryUUID}`)
			return
		}
		textureMap.delete(oldPrimaryUUID)
		textureMap.add(newPrimaryUUID, secondaryUuid)
		textureMapUpdated++
	}

	function selectNewSecondaryTexture(e: Event, primaryUUID: string) {
		const select = e.target as HTMLSelectElement
		const textureName = select.value.trim()
		const newSecondaryUUID = SECONDARY_TEXTURES.find(t => t.name === textureName)?.uuid
		if (!newSecondaryUUID) {
			console.error(`Failed to find new secondary texture with the name: ${textureName}`)
			return
		}
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

	<div class="uuid">
		{$uuid}
	</div>

	{#if !variant.isDefault}
		<div class="toolbar" style="margin: 8px 0;">
			<div>
				{translate('dialog.variant_config.texture_map.title')}
			</div>
			<div class="spacer" />
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class="tool"
				title={translate('dialog.variant_config.texture_map.create_new_mapping')}
			>
				<i class="material-icons icon" on:click={() => createTextureMapping()}>add</i>
			</div>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore missing-declaration -->
			<i
				class="fa fa-question dialog_form_description"
				title={translate('dialog.variant_config.texture_map.description')}
				on:click={() => {
					const tooltip = translate('dialog.variant_config.texture_map.description')
					Blockbench.showQuickMessage(tooltip, 50 * tooltip.length)
				}}
			/>
		</div>
		<lu class="texture-map-container">
			{#key textureMapUpdated}
				{#each [...textureMap.map.entries()] as entry, _index}
					<div class="texture-mapping-item"></div>
					<li class="texture-mapping-item">
						<div class="texture-mapping-item-dropdown-container">
							<div class="img-container">
								<img src={getTextureSrc(entry[0])} alt="" />
							</div>
							<select
								class="texture-mapping-item-dropdown"
								on:change={e => selectNewPrimaryTexture(e, entry[0])}
							>
								<!-- svelte-ignore missing-declaration -->
								{#each PRIMARY_TEXTURES as texture}
									<option selected={texture.uuid === entry[0]}>
										{texture.name}
									</option>
								{/each}
							</select>
						</div>

						<i class="material-icons icon">east</i>

						<div class="texture-mapping-item-dropdown-container">
							<div class="img-container">
								<img src={getTextureSrc(entry[1])} alt="" />
							</div>
							<select
								class="texture-mapping-item-dropdown"
								on:change={e => selectNewSecondaryTexture(e, entry[0])}
							>
								<!-- svelte-ignore missing-declaration -->
								{#each SECONDARY_TEXTURES as texture}
									<option selected={texture.uuid === entry[1]}>
										{texture.name}
									</option>
								{/each}
							</select>
						</div>

						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<i
							class="material-icons icon tool"
							on:click={() => deleteTextureMapping(entry[0])}>delete</i
						>
					</li>
				{:else}
					<div class="no-mappings">
						{translate('dialog.variant_config.texture_map.no-mappings')}
					</div>
				{/each}
			{/key}
		</lu>
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
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
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
	.img-container {
		display: flex;
		align-items: flex-start;
		width: 128px;
		height: 128px;
		pointer-events: none;
		background: repeating-conic-gradient(var(--color-dark) 0% 25%, transparent 0% 50%) 50% /
			16px 16px;
	}
	img {
		width: 128px;
		pointer-events: none;
	}
	.texture-mapping-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.texture-mapping-item-dropdown-container {
		position: relative;
		flex-grow: 1;
		height: 164px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.texture-mapping-item-dropdown {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 128px;
	}
	.texture-map-container {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		background-color: var(--color-back);
		padding: 4px;
		overflow-y: auto;
		max-height: 600px;
		overflow-y: auto;
		max-height: 16rem;
	}
	.spacer {
		flex-grow: 1;
	}
	.toolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
</style>
