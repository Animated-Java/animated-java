<script lang="ts" module>
	import { untrack } from 'svelte'
	import CustomCodeJar from '../../svelteComponents/customCodeJar.svelte'
	import {
		getSlotDefaultTexture,
		getSlotTextures,
		getTextureSlot,
		getTextureSlots,
	} from '../../textureSlots'
	import { localize as translate } from '../../util/lang'
	import { editKeyframe, keyframeTextEdit } from './keyframeEdit'

	function displayName(texture: Texture | undefined) {
		return texture?.name.replace(/\.png$/i, '') ?? ''
	}

	function textureIcon(texture: Texture) {
		const img = document.createElement('img')
		img.classList.add('icon')
		img.src = texture.img.src
		img.style.imageRendering = 'pixelated'
		return img
	}
</script>

<script lang="ts">
	let { keyframe }: { keyframe: _Keyframe } = $props()

	// The panel is remounted for each selected keyframe, so these only need its initial values.
	let textureSlots: Record<string, string> = $state(
		untrack(() => ({ ...keyframe.texture_slots }))
	)
	let executeCondition = $state(untrack(() => keyframe.execute_condition ?? ''))

	const rows = $derived(
		Object.entries(textureSlots)
			.map(([slotUuid, textureUuid]) => {
				const slot = getTextureSlot(slotUuid)
				const texture = slot && getSlotTextures(slot).find(t => t.uuid === textureUuid)
				return slot && { slot, texture }
			})
			.filter(row => !!row)
	)

	$effect(() => {
		keyframe.execute_condition = executeCondition
	})

	function save(next: Record<string, string>) {
		textureSlots = next
		editKeyframe(keyframe, () => (keyframe.texture_slots = next))
	}

	function openAddMenu(event: MouseEvent) {
		const available = getTextureSlots().filter(
			slot => !(slot.uuid in textureSlots) && getSlotDefaultTexture(slot)
		)
		if (!available.length) {
			Blockbench.showQuickMessage(translate('slot_textures_editor.all_slots_added'))
			return
		}
		new Menu(
			available.map(slot => ({
				name: slot.name,
				icon: 'style',
				click: () =>
					save({ ...textureSlots, [slot.uuid]: getSlotDefaultTexture(slot)!.uuid }),
			}))
		).open(event)
	}

	function openTextureMenu(event: MouseEvent, slot: Texture) {
		new Menu(
			getSlotTextures(slot).map(texture => ({
				name: displayName(texture),
				icon: textureIcon(texture),
				click: () => save({ ...textureSlots, [slot.uuid]: texture.uuid }),
			}))
		).open(event.currentTarget as HTMLElement)
	}

	function remove(slot: Texture) {
		const next = { ...textureSlots }
		delete next[slot.uuid]
		save(next)
	}
</script>

<div class="section-header" title={translate('panel.keyframe.texture_slot.description')}>
	<span>{translate('panel.keyframe.texture_slot.title')}</span>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="in_list_button"
		title={translate('slot_textures_editor.add_slot')}
		onclick={openAddMenu}
	>
		<i class="material-icons">add</i>
	</div>
</div>

<div class="row-container">
	{#each rows as { slot, texture } (slot.uuid)}
		<div class="row">
			<i class="material-icons subtle">style</i>
			<span class="slot-name">{slot.name}</span>
			<i class="material-icons subtle arrow">east</i>
			<button
				type="button"
				class="texture-trigger"
				onclick={event => openTextureMenu(event, slot)}
			>
				{#if texture}
					<img class="thumb" src={texture.img.src} alt="" />
				{/if}
				<span class="texture-name">{displayName(texture)}</span>
				<i class="material-icons">arrow_drop_down</i>
			</button>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="in_list_button"
				title={translate('panel.keyframe.remove')}
				onclick={() => remove(slot)}
			>
				<i class="material-icons">clear</i>
			</div>
		</div>
	{:else}
		<div class="empty">{translate('panel.keyframe.texture_slot.empty')}</div>
	{/each}
</div>

<div class="bar flex custom-bar" use:keyframeTextEdit={keyframe}>
	<label
		for="execute_condition"
		class="undefined"
		style="font-weight: unset;"
		title={translate('panel.keyframe.execute_condition.description')}
	>
		{translate('panel.keyframe.execute_condition.title')}
	</label>
	<CustomCodeJar
		bind:value={executeCondition}
		placeholder={'if score @s matches 1..'}
		syntax="mcfunction"
	/>
</div>

<style>
	.section-header {
		display: flex;
		align-items: center;
		height: 30px;
		padding: 2px 4px 2px 8px;
		background-color: var(--color-elevated);
	}
	.section-header > span {
		flex-grow: 1;
	}
	.row-container {
		background: var(--color-dark);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 31px;
		padding: 0 4px 0 8px;
		background: var(--color-back);
	}
	/* .row:hover {
		background-color: var(--color-button);
	} */
	.subtle {
		font-size: 18px;
		color: var(--color-subtle_text);
	}
	.arrow {
		font-size: 16px;
	}
	.slot-name {
		min-width: 48px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.texture-trigger {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1 1 0;
		min-width: 0;
		height: 26px;
		padding: 0 2px;
		border: none;
		color: var(--color-text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.texture-trigger:hover {
		color: var(--color-light);
	}
	.thumb {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		image-rendering: pixelated;
		border: 1px solid var(--color-border);
		margin-left: 2px;
	}
	.texture-name {
		flex: 1 1 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.empty {
		padding: 4px 8px;
		color: var(--color-subtle_text);
		font-style: italic;
	}
	.custom-bar {
		flex-direction: column;
	}
</style>
