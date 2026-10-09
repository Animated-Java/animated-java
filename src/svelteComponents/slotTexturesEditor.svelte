<script lang="ts">
	import MissingTexture from '../assets/missing_texture.png'
	import {
		getSlotDefaultTexture,
		getSlotTextures,
		getTextureSlot,
		getTextureSlots,
	} from '../textureSlots'
	import { localize as translate } from '../util/lang'
	import TextureSelect from './textureSelect.svelte'

	interface Props {
		title: string
		/** HTML shown under the title. */
		description?: string
		/** Shown when no slots are listed. */
		emptyText: string
		/** Slot UUID -> texture UUID. Slots left out are unchanged. */
		value: Record<string, string>
		onchange: (value: Record<string, string>) => void
	}

	let { title, description, emptyText, value, onchange }: Props = $props()

	function openAddSlotMenu(event: MouseEvent) {
		const available = getTextureSlots().filter(
			slot => !(slot.uuid in value) && getSlotDefaultTexture(slot)
		)
		if (!available.length) {
			Blockbench.showQuickMessage(translate('slot_textures_editor.all_slots_added'))
			return
		}
		new Menu(
			available.map(slot => ({
				name: slot.name,
				icon: 'style',
				click: () => onchange({ ...value, [slot.uuid]: getSlotDefaultTexture(slot)!.uuid }),
			}))
		).open(event)
	}

	function removeSlot(slotUuid: string) {
		const next = { ...value }
		delete next[slotUuid]
		onchange(next)
	}
</script>

<div class="toolbar">
	<div>{title}</div>
	<div class="spacer"></div>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="tool" title={translate('slot_textures_editor.add_slot')} onclick={openAddSlotMenu}>
		<i class="material-icons icon">add</i>
	</div>
</div>
{#if description}
	<div class="description">{@html description}</div>
{/if}

<ul class="slot-list">
	{#each Object.entries(value) as [slotUuid, textureUuid] (slotUuid)}
		{@const slot = getTextureSlot(slotUuid)}
		{#if slot}
			<li class="slot-item">
				<div class="slot-name">{slot.name}</div>

				<i class="material-icons icon">east</i>

				<TextureSelect
					textures={getSlotTextures(slot)}
					value={textureUuid}
					missingSrc={MissingTexture}
					onchange={uuid => onchange({ ...value, [slotUuid]: uuid })}
				/>

				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<i class="material-icons icon tool trash" onclick={() => removeSlot(slotUuid)}
					>delete</i
				>
			</li>
		{/if}
	{:else}
		<div class="empty">{emptyText}</div>
	{/each}
</ul>

<style>
	.toolbar {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin: 8px 16px 8px;
		width: -webkit-fill-available;
	}
	.spacer {
		flex-grow: 1;
	}
	.description {
		font-size: 0.9em;
		color: var(--color-subtle_text);
		margin-top: -6px;
		margin-bottom: 16px;
		max-width: 80%;
		margin-left: calc(16px + 0.75rem);
	}
	.slot-list {
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
	.slot-item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 2fr) auto;
		align-items: center;
		gap: 16px;
		padding-right: 16px;
	}
	.slot-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.empty {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
	}
	.trash {
		height: unset;
	}
</style>
