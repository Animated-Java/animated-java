<script lang="ts">
	import { dndzone } from 'svelte-dnd-action'
	import { translate } from '../host'
	import Swatch from './swatch.svelte'
	import { explainLocked, useAsBrushColor, type SwatchEditor } from './swatchEditor.svelte'

	/** The key over the selected permutation's palette, each key color above the one it becomes. */
	let { editor }: { editor: SwatchEditor } = $props()

	const selected = $derived(editor.selected)
	const lineup = $derived(editor.lineup)
	const keyLength = $derived(editor.key.length)

	let lineupElement = $state<HTMLElement>()

	const pick = (color: string) => (editor.pickOnClick ? () => useAsBrushColor(color) : undefined)
</script>

<div class="lineup-wrap">
	<div class="lineup" bind:this={lineupElement}>
		<div class="lineup-row">
			<span class="lineup-label">{translate('dialog.set.key')}</span>
			<div
				class="swatch-zone"
				use:dndzone={editor.zoneOptions(
					editor.keyLineupZone,
					'palette-key-lineup',
					editor.keyEditable,
					editor.liftColumn(lineupElement)
				)}
				onconsider={editor.keyLineupZone.consider}
				onfinalize={editor.keyLineupZone.finalize}
			>
				{#each editor.keyLineupZone.items as item (item.id)}
					<span class="swatch-item">
						<Swatch
							kind="key"
							color={item.color}
							title={editor.swatchTitle('key', item.color)}
							editing={editor.isEditing('key', Number(item.id))}
							following={!!editor.keyChipZone.dragged &&
								item.id === editor.draggedKeyId}
							onclick={pick(item.color)}
							onedit={anchor => editor.openSwatch(anchor, 'key', Number(item.id))}
						/>
					</span>
				{/each}
			</div>
			{#each lineup.slice(keyLength) as _, offset (offset)}
				<Swatch kind="missing" />
			{/each}
			<Swatch
				kind="add"
				locked={editor.isReference}
				editing={!!editor.edit?.adding}
				title={translate('dialog.set.add_key_color')}
				onclick={event =>
					editor.isReference
						? explainLocked()
						: editor.addKeyColor(event.currentTarget as HTMLElement)}
			/>
		</div>
		{#if selected}
			<div class="lineup-row">
				<span class="lineup-label"></span>
				{#each lineup as _, i (i)}
					<span
						class="arrow"
						class:lifted={editor.columnLifted && i === editor.keyDropIndex}
						><i class="material-icons">south</i></span
					>
				{/each}
			</div>
			<div class="lineup-row">
				<span class="lineup-label" title={selected.suffix}>{selected.suffix}</span>
				<div
					class="swatch-zone"
					use:dndzone={editor.zoneOptions(
						editor.paletteZone,
						'palette-palette-lineup',
						editor.paletteEditable
					)}
					onconsider={editor.paletteZone.consider}
					onfinalize={editor.paletteZone.finalize}
				>
					{#each editor.paletteZone.items as item, position (item.id)}
						<span class="swatch-item">
							<Swatch
								kind="palette"
								id={item.id}
								color={item.color}
								title={editor.swatchTitle('palette', item.color)}
								editing={editor.isEditing('palette', Number(item.id))}
								extra={position >= keyLength}
								lifted={editor.columnLifted && item.id === editor.draggedKeyId}
								following={editor.columnHighlighted &&
									item.id === editor.draggedKeyId}
								onclick={pick(item.color)}
								onedit={anchor =>
									editor.openSwatch(anchor, 'palette', Number(item.id))}
							/>
						</span>
					{/each}
				</div>
				{#each lineup.slice(editor.paletteZone.items.length) as _, offset (offset)}
					{@const index = editor.paletteZone.items.length + offset}
					<Swatch
						kind="missing"
						editing={editor.isEditing('palette', index)}
						title={translate('dialog.set.palette_color_missing')}
						onclick={event =>
							editor.openSwatch(event.currentTarget as HTMLElement, 'palette', index)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.lineup-wrap {
		overflow-x: auto;
		background: var(--color-back);
		border-radius: 6px;
		padding: 10px;
		flex: none;
	}
	.lineup {
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: max-content;
	}
	.lineup-row {
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.lineup-label {
		width: 72px;
		flex: none;
		color: var(--color-subtle_text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding-right: 6px;
	}
	.arrow {
		display: flex;
		flex: none;
		width: 28px;
		justify-content: center;
		color: var(--color-subtle_text);
	}
	.arrow i {
		font-size: 14px;
	}
	/* Travelling with a dragged key swatch, so the column's real cells leave a gap */
	.lifted {
		visibility: hidden;
	}
	.swatch-zone {
		display: flex;
		flex: none;
		gap: 3px;
	}
	/* An empty zone would still take a gap, pushing its row out of line with the others */
	.swatch-zone:empty {
		display: none;
	}
	.swatch-item {
		display: flex;
		flex: none;
	}
</style>
