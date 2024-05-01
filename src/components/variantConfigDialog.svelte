<script lang="ts" context="module">
	import { type Valuable } from '../util/stores'
	import { translate } from '../util/translation'
	import { TRANSPARENT_TEXTURE, TextureMap, Variant } from '../variants'
	import Checkbox from './dialogItems/checkbox.svelte'
	import LineInput from './dialogItems/lineInput.svelte'
	import MissingTexture from '../assets/missing_texture.png'
</script>

<script lang="ts">
	import Collection from './dialogItems/collection.svelte'

	export let variant: Variant
	export let displayName: Valuable<string>
	export let name: Valuable<string>
	export let uuid: Valuable<string>
	export let textureMap: TextureMap
	export let generateNameFromDisplayName: Valuable<boolean>
	export let excludedBones: Valuable<Array<{ name: string; value: string }>>

	const availableTextures = [...Texture.all, TRANSPARENT_TEXTURE]

	const availableBones = Group.all.map(group => {
		const entry = excludedBones.get().find(bone => bone.value === group.uuid)
		if (entry) {
			entry.name = group.name
		}

		return { name: group.name, value: group.uuid }
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
		const texture = Texture.all.find(t => t.uuid === uuid)
		if (!texture) return MissingTexture
		return texture.img.src
	}

	function selectNewPrimaryTexture(e: Event, oldPrimaryUUID: string) {
		const select = e.target as HTMLSelectElement
		const textureName = select.value.trim()
		const newPrimaryUUID = Texture.all.find(t => t.name === textureName)?.uuid
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
		const newSecondaryUUID = Texture.all.find(t => t.name === textureName)?.uuid
		if (!newSecondaryUUID) {
			console.error(`Failed to find new secondary texture with the name: ${textureName}`)
			return
		}
		textureMap.add(primaryUUID, newSecondaryUUID)
		textureMapUpdated++
	}

	function getUnusedPrimaryTextures() {
		const usedTextures = [...textureMap.map.keys()]
		return Texture.all.filter(t => !usedTextures.includes(t.uuid))
	}
</script>

<div class="dialog_container">
	<LineInput
		label={translate('dialog.variant_config.variant_display_name')}
		bind:value={displayName}
		tooltip={translate('dialog.variant_config.variant_display_name.description')}
	/>

	{#key $name}
		{#if $generateNameFromDisplayName}
			<LineInput
				label={translate('dialog.variant_config.variant_name')}
				bind:value={name}
				tooltip={translate('dialog.variant_config.variant_name.description')}
				disabled
			/>
		{:else}
			<LineInput
				label={translate('dialog.variant_config.variant_name')}
				bind:value={name}
				tooltip={translate('dialog.variant_config.variant_name.description')}
			/>
		{/if}
	{/key}

	<Checkbox
		label={translate('dialog.variant_config.generate_name_from_display_name')}
		bind:checked={generateNameFromDisplayName}
		tooltip={translate('dialog.variant_config.generate_name_from_display_name.description')}
	/>

	<div class="uuid">
		{$uuid}
	</div>

	<div class="toolbar" style="margin: 8px 0;">
		<div>
			{translate('dialog.variant_config.texture_map.title')}
		</div>
		<div class="spacer" />
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="tool"
			title={translate('dialog.variant_config.texture_map.create_new_mapping')}
			on:click={() => {}}
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
	<lu class="texture_map_container">
		{#key textureMapUpdated}
			{#each [...textureMap.map.entries()] as entry, index}
				<div class="texture_mapping_item"></div>
				<li class="texture_mapping_item">
					<div class="texture_mapping_item_dropdown_container">
						<img src={getTextureSrc(entry[0])} alt="" />
						<select
							class="texture_mapping_item_dropdown"
							on:change={e => selectNewPrimaryTexture(e, entry[0])}
						>
							<!-- svelte-ignore missing-declaration -->
							{#each availableTextures as texture}
								<option selected={texture.uuid === entry[0]}>
									{texture.name}
								</option>
							{/each}
						</select>
					</div>

					<i class="material-icons icon">east</i>

					<div class="texture_mapping_item_dropdown_container">
						<img src={getTextureSrc(entry[1])} alt="" />
						<select
							class="texture_mapping_item_dropdown"
							on:change={e => selectNewSecondaryTexture(e, entry[0])}
						>
							<!-- svelte-ignore missing-declaration -->
							{#each availableTextures as texture}
								<option selected={texture.uuid === entry[1]}>
									{texture.name}
								</option>
							{/each}
						</select>
					</div>

					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<i class="material-icons icon" on:click={() => deleteTextureMapping(entry[0])}
						>delete</i
					>
				</li>
			{:else}
				<div class="no_mappings">
					{translate('dialog.variant_config.texture_map.no_mappings')}
				</div>
			{/each}
		{/key}
	</lu>
	<Collection
		label={translate('dialog.variant_config.excluded_bones.title')}
		tooltip={translate('dialog.variant_config.bone_lists.description')}
		availableItemsColumnLable={translate('dialog.variant_config.included_bones.title')}
		availableItemsColumnTooltip={translate('dialog.variant_config.included_bones.description')}
		includedItemsColumnLable={translate('dialog.variant_config.excluded_bones.title')}
		includedItemsColumnTooltip={translate('dialog.variant_config.excluded_bones.description')}
		swapColumnsButtonTooltip={translate('dialog.variant_config.swap_columns_button.tooltip')}
		availableItems={availableBones}
		bind:includedItems={excludedBones}
	/>
</div>

<style>
	.dialog_container {
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
	.no_mappings {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
	}
	img {
		width: 128px;
		height: 128px;
		pointer-events: none;
	}
	.texture_mapping_item {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.texture_mapping_item_dropdown_container {
		position: relative;
		flex-grow: 1;
		height: 164px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.texture_mapping_item_dropdown {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 128px;
	}
	.texture_map_container {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		background-color: var(--color-back);
		padding: 4px;
		overflow-y: auto;
		max-height: 600px;
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
