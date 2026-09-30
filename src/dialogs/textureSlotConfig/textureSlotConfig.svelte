<script lang="ts" module>
	import MissingTexture from '../../assets/missing_texture.png'
	import { projectTargetVersionIsAtLeast } from '../../formats/blueprint'
	import LineInput from '../../svelteComponents/dialogItems/lineInput.svelte'
	import {
		getSlotFaces,
		isTextureSlot,
		TEXTURE_SLOT_COMMANDS_MIN_VERSION,
	} from '../../textureSlots'
	import { localize as translate } from '../../util/lang'

	interface Row {
		id: string
		texture: Texture | undefined
	}

	const FLIP_DURATION = 100
</script>

<script lang="ts">
	import { type Observable } from 'svelte-observable-store'
	import { dndzone } from 'svelte-dnd-action'
	import { flip } from 'svelte/animate'

	interface Props {
		slot: Texture
		name: Observable<string>
		textures: Observable<string[]>
		preview: Observable<string | undefined>
	}

	let { slot, name, textures, preview }: Props = $props()

	const faceCount = $derived(getSlotFaces(slot).length)
	const supportsSlotCommands = projectTargetVersionIsAtLeast(TEXTURE_SLOT_COMMANDS_MIN_VERSION)

	let rows = $state.raw<Row[]>(toRows($textures))

	function toRows(uuids: string[]): Row[] {
		return uuids.map(id => ({ id, texture: Texture.all.find(t => t.uuid === id) }))
	}

	function setRows(next: Row[]) {
		rows = next
		textures.set(next.map(row => row.id))
		if (!next.some(row => row.id === $preview)) preview.set(next[0]?.id)
	}

	function openAddMenu(e: MouseEvent) {
		const available = Texture.all.filter(
			t => !isTextureSlot(t) && !rows.some(row => row.id === t.uuid)
		)
		if (!available.length) {
			Blockbench.showQuickMessage(translate('dialog.texture_slot.all_textures_added'))
			return
		}
		new Menu(
			available.map(texture => ({
				name: texture.name,
				icon: texture.img,
				click: () => setRows([...rows, { id: texture.uuid, texture }]),
			}))
		).open(e)
	}

	function remove(id: string) {
		setRows(rows.filter(row => row.id !== id))
	}
</script>

<div class="dialog-container">
	<LineInput
		label={translate('dialog.texture_slot.name')}
		bind:value={name}
		tooltip={translate('dialog.texture_slot.name.description')}
		defaultValue={slot.name}
	/>

	{#if !supportsSlotCommands}
		<div class="notice">
			<i class="material-icons icon">info</i>
			<span>
				{translate(
					'dialog.texture_slot.old_version_notice',
					TEXTURE_SLOT_COMMANDS_MIN_VERSION
				)}
			</span>
		</div>
	{/if}

	<div class="list-header">
		<div>{translate('dialog.texture_slot.textures')}</div>
		<div class="spacer"></div>
		<span class="face-count">{translate('dialog.texture_slot.faces', String(faceCount))}</span>
		<button
			class="tool"
			title={translate('dialog.texture_slot.add_texture')}
			aria-label={translate('dialog.texture_slot.add_texture')}
			onclick={e => openAddMenu(e)}
		>
			<i class="material-icons icon">add</i>
		</button>
	</div>
	<ul
		class="texture-list"
		use:dndzone={{ items: rows, flipDurationMs: FLIP_DURATION, dropTargetStyle: {} }}
		onconsider={(e: any) => (rows = e.detail.items)}
		onfinalize={(e: any) => setRows(e.detail.items)}
	>
		{#each rows as row, i (row.id)}
			<li
				class="texture-row"
				class:previewed={$preview === row.id}
				animate:flip={{ duration: FLIP_DURATION }}
			>
				<i class="material-icons icon handle">drag_indicator</i>
				<img
					class="thumbnail"
					src={row.texture?.img?.src ?? MissingTexture}
					alt=""
					width="32"
					height="32"
				/>
				<span class="texture-name">
					{row.texture?.name ?? translate('dialog.texture_slot.missing')}
				</span>
				{#if i === 0}
					<span class="default-label">
						<i class="material-icons">star</i>
						{translate('dialog.texture_slot.default')}
					</span>
				{/if}
				<button
					class="tool"
					title={translate('dialog.texture_slot.preview')}
					aria-label={translate('dialog.texture_slot.preview')}
					aria-pressed={$preview === row.id}
					disabled={!row.texture}
					onclick={() => preview.set(row.id)}
				>
					<i class="material-icons icon" class:off={$preview !== row.id}>
						{$preview === row.id ? 'visibility' : 'visibility_off'}
					</i>
				</button>
				<button
					class="tool"
					title={translate('dialog.texture_slot.remove')}
					aria-label={translate('dialog.texture_slot.remove')}
					onclick={() => remove(row.id)}
				>
					<i class="material-icons icon">delete</i>
				</button>
			</li>
		{:else}
			<div class="empty">{translate('dialog.texture_slot.no_textures')}</div>
		{/each}
	</ul>
	<div class="hint">{translate('dialog.texture_slot.hint')}</div>
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
		max-height: 75vh;
		overflow-x: hidden;
		overflow-y: auto;
	}
	.notice {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		margin: 4px 16px 8px;
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
	.list-header {
		display: flex;
		align-items: center;
		margin: 8px 16px 0;
	}
	.spacer {
		flex-grow: 1;
	}
	.face-count {
		margin-right: 8px;
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
	.hint {
		margin: 0 16px 8px;
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
	.texture-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0 16px 8px;
		padding: 4px;
		min-height: 48px;
		background: var(--color-back);
		border-radius: 6px;
	}
	.texture-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px;
		border-radius: 4px;
		cursor: grab;
	}
	.texture-row:hover,
	.texture-row.previewed {
		background: var(--color-button);
	}
	.handle {
		color: var(--color-subtle_text);
	}
	.thumbnail {
		image-rendering: pixelated;
		background: var(--color-dark);
	}
	.texture-name {
		flex-grow: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.default-label {
		display: flex;
		align-items: center;
		gap: 2px;
		color: var(--color-accent);
		font-size: 0.85em;
	}
	.default-label i {
		font-size: 16px;
	}
	/* Undo Blockbench's global dialog button style */
	button.tool {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		min-width: 0;
		height: 28px;
		margin: 0;
		padding: 0;
		background: none;
		border: none;
		box-shadow: none;
		color: inherit;
		cursor: pointer;
	}
	button.tool:hover {
		color: var(--color-light);
	}
	button.tool i {
		font-size: 20px;
		line-height: 28px;
		height: 28px;
	}
	button.tool:disabled {
		cursor: default;
		opacity: 0.4;
	}
	.off {
		color: var(--color-subtle_text);
	}
	.empty {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
		padding: 12px;
	}
</style>
