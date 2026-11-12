<script lang="ts" module>
	import {
		SHADOW_ITEM_MARKER_PROPERTY_NAME,
		type DndEvent,
		type TransformDraggedElementFunction,
	} from 'svelte-dnd-action'
	import { translate } from '../host'
	import type { PaletteColors } from '../recolor'
	import type { IPalettePermutation, IPaletteSetData, IPaletteStrip } from '../types'

	/** Colors are stored as `#rrggbbaa`; some sources leave the alpha off. */
	export const withAlpha = (color: string) => (color.length === 7 ? color + 'ff' : color)

	/** Sets the Color panel's primary color, which has no alpha. */
	export function useAsBrushColor(color: string) {
		ColorPanel.set(color.slice(0, 7))
	}

	/** The Color panel's primary color, as `#rrggbbaa`. */
	function getBrushColor(): string {
		return tinycolor(ColorPanel.get()).toHex8String()
	}

	/** Why a reference set's contents can't change, shown instead of acting. */
	export function explainLocked() {
		Blockbench.showQuickMessage(translate('dialog.set.reference_locked'), 4000)
	}

	/**
	 * Lets Enter and Space click a `role="button"` element inside a drag zone. Draggables can't be
	 * real buttons: the zone won't start a drag from an element with a `value`, which buttons have.
	 * Bind it with `onkeydowncapture`: Svelte delegates plain `onkeydown` to the root, which the
	 * zone's own key handler would reach first, claiming the keys for keyboard dragging.
	 */
	export function clickOnKey(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return
		event.preventDefault()
		event.stopPropagation()
		;(event.currentTarget as HTMLElement).click()
	}

	/**
	 * A drag-to-reorder zone over a list in the set. Mid-drag it shows the library's working order;
	 * on drop it hands the final order to `reorder` and goes back to showing the set.
	 */
	export class SortableZone<T extends { id: string }> {
		dragged = $state.raw<T[]>()

		constructor(
			private readonly source: () => T[],
			private readonly reorder: (items: T[]) => void,
			/** Runs as a drag starts, and on every move after. */
			private readonly ondrag?: () => void
		) {}

		get items() {
			return this.dragged ?? this.source()
		}

		consider = (event: CustomEvent<DndEvent<T>>) => {
			this.ondrag?.()
			this.dragged = event.detail.items
		}

		finalize = (event: CustomEvent<DndEvent<T>>) => {
			this.dragged = undefined
			this.reorder(event.detail.items)
		}
	}

	/** A swatch in a drag zone. `id` is its index in the strip when the drag started. */
	export interface ISwatchItem {
		id: string
		color: string
		/** Marks the placeholder the zone shows where a dragged swatch would land. */
		[SHADOW_ITEM_MARKER_PROPERTY_NAME]?: boolean
	}

	const toSwatchItems = (colors: PaletteColors): ISwatchItem[] =>
		colors.map((color, i) => ({ id: String(i), color }))

	/** The original indices of `items`, in their new order, or undefined if nothing moved. */
	function getNewOrder(items: ISwatchItem[]) {
		const order = items.map(item => Number(item.id))
		return order.some((from, to) => from !== to) ? order : undefined
	}

	/** One key zone's working order, for the other key zone to mirror without the placeholder. */
	const mirror = (items: ISwatchItem[] | undefined): ISwatchItem[] | undefined =>
		items?.map(({ id, color }) => ({ id, color }))

	interface ISetSnapshot {
		key: IPaletteStrip
		strips: Record<string, IPaletteStrip>
	}

	export interface ISwatchEdit {
		kind: 'key' | 'palette'
		index: number
		anchor: HTMLElement
		/** The key and every palette as they were when the popover opened, restored by Escape. */
		original: ISetSnapshot
		permutation?: string
		/** Opened from the add button, for a new key color. */
		adding?: boolean
		/** Palettes that grew along with the key while adding a key color, to follow its color. */
		extended?: string[]
	}

	interface ISwatchAction {
		label: string
		icon: string
		onclick: () => void
	}

	interface ISwatchPopover {
		color: string | undefined
		note: string | undefined
		actions: ISwatchAction[]
	}

	interface ISwatchEditorOptions {
		/** The set being edited, as reactive state. Edits change it in place. */
		data: () => IPaletteSetData
		/** The permutation shown under the key, if any. */
		selected: () => IPalettePermutation | undefined
		/** The key's colors: stored ones, or the loaded pack key. */
		key: () => PaletteColors
		/** A permutation's colors: stored ones, or the loaded pack palette. */
		colorsOf: (permutation: IPalettePermutation) => PaletteColors
		/** Whether left-clicking a swatch sets the brush color. */
		pickOnClick?: boolean
		/** Runs after each finished edit: a drop, a popover closing, or a removed color. */
		oncommit?: () => void
		/** Runs after an open edit is dropped, either reverted by Escape or by `dismiss`. */
		ondiscard?: () => void
	}

	/**
	 * Edits a set's key and one permutation's palette: swatch popovers, drag-to-reorder zones, and
	 * the rules that keep palettes lined up with the key. Shared by the Permutation Set dialog and
	 * the Permutation panel. Create it while a component initializes.
	 */
	export class SwatchEditor {
		private readonly options: ISwatchEditorOptions

		// Raw, so `original` stays a plain snapshot instead of a proxy that could alias the set.
		edit = $state.raw<ISwatchEdit>()

		readonly keyChipZone = new SortableZone<ISwatchItem>(
			() => mirror(this.keyLineupZone.dragged) ?? toSwatchItems(this.key),
			items => this.reorderKey(items),
			() => this.close()
		)
		readonly keyLineupZone = new SortableZone<ISwatchItem>(
			() => mirror(this.keyChipZone.dragged) ?? toSwatchItems(this.key),
			items => this.reorderKey(items),
			() => this.close()
		)
		readonly paletteZone = new SortableZone<ISwatchItem>(
			() => this.paletteItems(),
			items => this.reorderPalette(items),
			() => this.close()
		)

		/** The key's working order while either key zone is mid-drag. */
		readonly keyDrag = $derived(this.keyLineupZone.dragged ?? this.keyChipZone.dragged)
		/** Where the dragged key color would land, mid-drag. */
		readonly keyDropIndex = $derived(
			this.keyDrag?.findIndex(item => item[SHADOW_ITEM_MARKER_PROPERTY_NAME]) ?? -1
		)
		/** The dragged key color's id, mid-drag. */
		readonly draggedKeyId = $derived(this.keyDrag?.[this.keyDropIndex]?.id)

		readonly popover = $derived.by(() => this.getPopover())

		constructor(options: ISwatchEditorOptions) {
			this.options = options
			// A different permutation has its own swatches, so close the popover when it changes.
			$effect(() => {
				const edit = this.edit
				if (edit?.permutation && edit.permutation !== this.selected?.uuid) this.close()
			})
		}

		get data() {
			return this.options.data()
		}

		get selected() {
			return this.options.selected()
		}

		get key() {
			return this.options.key()
		}

		get isReference() {
			return !!this.data.reference
		}

		get pickOnClick() {
			return !!this.options.pickOnClick
		}

		get keyEditable() {
			return !this.isReference && !!this.data.key.colors
		}

		get paletteEditable() {
			return !this.isReference && !!this.selected?.strip.colors
		}

		colorsOf(permutation: IPalettePermutation): PaletteColors {
			return this.options.colorsOf(permutation)
		}

		/** Key and palette colors paired up, padded to the longer of the two. */
		get lineup() {
			const key = this.key
			const palette = this.selected ? this.colorsOf(this.selected) : []
			return Array.from({ length: Math.max(key.length, palette.length) }, (_, i) => ({
				key: key[i] as string | undefined,
				palette: palette[i] as string | undefined,
			}))
		}

		/**
		 * Whether the selected palette moves with its key colors: only when `reorderKey` would move
		 * it, as a stored palette that lines up with the key.
		 */
		get paletteLinesUp() {
			const colors = this.selected?.strip.colors
			return !!colors && colors.length === this.key.length
		}

		/** Lineup drags lift the whole column; chip drags highlight it, as it's out of reach. */
		get columnLifted() {
			return this.paletteLinesUp && !!this.keyLineupZone.dragged
		}

		get columnHighlighted() {
			return this.paletteLinesUp && !!this.keyChipZone.dragged
		}

		/** A swatch's tooltip, naming its color and how to use it. */
		swatchTitle(kind: ISwatchEdit['kind'], color: string) {
			if (this.pickOnClick) return translate('swatch.pick_or_edit', color)
			return translate(
				kind === 'key' ? 'dialog.set.key_color' : 'dialog.set.palette_color',
				color
			)
		}

		isEditing(kind: ISwatchEdit['kind'], index: number) {
			return this.edit?.kind === kind && this.edit.index === index
		}

		private paletteItems(): ISwatchItem[] {
			const colors = this.selected ? this.colorsOf(this.selected) : []
			if (!this.keyDrag || !this.paletteLinesUp) return toSwatchItems(colors)
			return this.keyDrag.map(({ id }) => ({ id, color: colors[Number(id)] }))
		}

		private snapshotStrips(): ISetSnapshot {
			const snapshot = $state.snapshot(this.data) as IPaletteSetData
			return {
				key: structuredClone(snapshot.key),
				strips: Object.fromEntries(
					snapshot.permutations.map(p => [p.uuid, structuredClone(p.strip)])
				),
			}
		}

		/** Opens a swatch's popover, or closes it if it's already open. */
		openSwatch(anchor: HTMLElement, kind: ISwatchEdit['kind'], index: number) {
			if (this.edit?.anchor === anchor) {
				this.close()
				return
			}
			this.close()
			this.edit = {
				kind,
				index,
				anchor,
				original: this.snapshotStrips(),
				permutation: kind === 'palette' ? this.selected!.uuid : undefined,
			}
		}

		/**
		 * Appends a key color and opens it for editing. Palettes that line up with the key get the
		 * same color at the new position, so the new shade maps to itself until it's changed.
		 */
		addKeyColor(anchor: HTMLElement) {
			if (this.edit?.anchor === anchor) {
				this.close()
				return
			}
			this.close()
			const data = this.data
			const original = this.snapshotStrips()
			if (!data.key.colors) {
				// A pack key; the popover offers to copy it into the set first.
				this.edit = { kind: 'key', index: this.key.length, anchor, original, adding: true }
				return
			}
			const length = data.key.colors.length
			const color = withAlpha(this.key.at(-1) ?? '#808080ff')
			const extended = data.permutations.filter(p => p.strip.colors?.length === length)
			for (const permutation of extended) permutation.strip.colors!.push(color)
			data.key.colors.push(color)
			this.edit = {
				kind: 'key',
				index: length,
				anchor,
				original,
				adding: true,
				extended: extended.map(p => p.uuid),
			}
		}

		/** Closes the popover, keeping its edits. */
		close() {
			if (!this.edit) return
			this.edit = undefined
			this.options.oncommit?.()
		}

		/** Closes the popover, putting back what it changed. */
		revert() {
			const edit = this.edit
			if (!edit) return
			const { key, strips } = structuredClone(edit.original)
			const data = this.data
			data.key = key
			for (const permutation of data.permutations) {
				if (strips[permutation.uuid]) permutation.strip = strips[permutation.uuid]
			}
			this.edit = undefined
			this.options.ondiscard?.()
		}

		/** Closes the popover without committing, for when the set was replaced underneath it. */
		dismiss() {
			if (!this.edit) return
			this.edit = undefined
			this.options.ondiscard?.()
		}

		/** Applies a picked color, but only for the edit it came from, never a later one. */
		input(edit: ISwatchEdit, color: string) {
			if (edit !== this.edit) return
			if (edit.kind === 'palette') {
				const permutation = this.editedPermutation()
				if (permutation) this.setPaletteColor(permutation, edit.index, color)
				return
			}
			const data = this.data
			data.key.colors![edit.index] = color
			for (const uuid of edit.extended ?? []) {
				const colors = data.permutations.find(p => p.uuid === uuid)?.strip.colors
				if (colors) colors[edit.index] = color
			}
		}

		/** The popover closed itself; `revert` is true for Escape. */
		onPopoverClose(edit: ISwatchEdit, revert: boolean) {
			if (edit !== this.edit) return
			if (revert) this.revert()
			else this.close()
		}

		private editedPermutation() {
			const uuid = this.edit?.permutation
			return uuid ? this.data.permutations.find(p => p.uuid === uuid) : undefined
		}

		/** Sets a stored palette color, filling any gap before it with white. */
		private setPaletteColor(permutation: IPalettePermutation, index: number, color: string) {
			const colors = permutation.strip.colors!
			while (colors.length <= index) colors.push('#ffffffff')
			colors[index] = color
		}

		/**
		 * Removes a key color, and the color at the same position from every stored palette that
		 * lines up with the key, so they stay aligned. Pack palettes can't change, so the checks
		 * flag them.
		 */
		private removeKeyColor(index: number) {
			const data = this.data
			const length = data.key.colors!.length
			for (const permutation of data.permutations) {
				if (permutation.strip.colors?.length === length)
					permutation.strip.colors.splice(index, 1)
			}
			data.key.colors!.splice(index, 1)
		}

		/**
		 * Reorders the key, and each stored palette that lines up with it, so every key color keeps
		 * its palette color. Same rule as `removeKeyColor`.
		 */
		private reorderKey(items: ISwatchItem[]) {
			const order = getNewOrder(items)
			const data = this.data
			const colors = data.key.colors
			if (!order || !colors) return
			for (const permutation of data.permutations) {
				const palette = permutation.strip.colors
				if (palette?.length === colors.length)
					permutation.strip.colors = order.map(i => palette[i])
			}
			data.key.colors = order.map(i => colors[i])
			this.options.oncommit?.()
		}

		/** Reorders only the selected palette, remapping its colors onto different key colors. */
		private reorderPalette(items: ISwatchItem[]) {
			const order = getNewOrder(items)
			const strip = this.selected?.strip
			const colors = strip?.colors
			if (!order || !strip || !colors) return
			strip.colors = order.map(i => colors[i])
			this.options.oncommit?.()
		}

		/** "Use as brush color", for a swatch that has a color. */
		private brushAction(color: string | undefined): ISwatchAction[] {
			if (!color) return []
			return [
				{
					label: translate('swatch.use_as_brush_color'),
					icon: 'colorize',
					onclick: () => useAsBrushColor(color),
				},
			]
		}

		/** "Set to brush color", for an editable swatch, applied through `input` like a pick. */
		private setToBrushAction(edit: ISwatchEdit): ISwatchAction {
			return {
				label: translate('swatch.set_to_brush_color'),
				icon: 'format_color_fill',
				onclick: () => this.input(edit, getBrushColor()),
			}
		}

		/** The popover's color, note and actions for the swatch being edited. */
		private getPopover(): ISwatchPopover | undefined {
			const edit = this.edit
			if (!edit) return undefined
			const { kind, index } = edit
			const data = this.data
			const key = this.key
			if (kind === 'key') {
				const shown = this.brushAction(key[index])
				if (this.isReference) {
					return {
						color: undefined,
						note: translate('dialog.set.reference_locked'),
						actions: shown,
					}
				}
				if (!data.key.colors) {
					return {
						color: undefined,
						note: translate('dialog.set.pack_key_note', data.key.id ?? ''),
						actions: [
							...shown,
							{
								label: translate('dialog.set.copy_key_to_edit'),
								icon: 'content_copy',
								onclick: () => {
									data.key = { colors: key.map(withAlpha) }
									// Opened from the add button: adding is a separate click once copied.
									if (this.edit?.adding) this.close()
								},
							},
						],
					}
				}
				return {
					color: data.key.colors[index],
					note: undefined,
					actions: [
						...shown,
						this.setToBrushAction(edit),
						{
							label: translate('dialog.set.remove_key_color'),
							icon: 'delete',
							onclick: () => {
								this.edit = undefined
								this.removeKeyColor(index)
								this.options.oncommit?.()
							},
						},
					],
				}
			}
			const permutation = this.editedPermutation()
			if (!permutation) return undefined
			const shown = this.brushAction(this.colorsOf(permutation)[index])
			if (this.isReference) {
				return {
					color: undefined,
					note: translate('dialog.set.reference_locked'),
					actions: shown,
				}
			}
			if (!permutation.strip.colors) {
				return {
					color: undefined,
					note: translate('dialog.set.pack_palette_note', permutation.strip.id ?? ''),
					actions: [
						...shown,
						{
							label: translate('dialog.set.copy_palette_to_edit'),
							icon: 'content_copy',
							onclick: () =>
								(permutation.strip = {
									colors: this.colorsOf(permutation).map(withAlpha),
								}),
						},
					],
				}
			}
			const keyColor = key[index] as string | undefined
			const fix = keyColor
				? {
						label: translate('dialog.set.reset_to_key_color'),
						icon: 'restart_alt',
						onclick: () =>
							this.setPaletteColor(permutation, index, withAlpha(keyColor)),
					}
				: {
						label: translate('dialog.set.remove_palette_color'),
						icon: 'delete',
						onclick: () => {
							this.edit = undefined
							permutation.strip.colors!.splice(index, 1)
							this.options.oncommit?.()
						},
					}
			return {
				color: permutation.strip.colors[index] ?? withAlpha(keyColor ?? '#ffffff'),
				note: undefined,
				actions: [...shown, this.setToBrushAction(edit), fix],
			}
		}

		/**
		 * Grows the lineup's dragged key swatch into its whole column, so the arrow and palette
		 * color under it travel with the cursor. The zone calls this on every move; it builds once.
		 */
		liftColumn(lineup: HTMLElement | undefined): TransformDraggedElementFunction {
			return (element, item) => {
				if (!element || !item || !this.paletteLinesUp || element.dataset.column) return
				const arrow = lineup?.querySelector('.arrow')
				const palette = lineup?.querySelector(`.palette-swatch[data-id="${item.id}"]`)
				if (!arrow || !palette) return
				element.dataset.column = 'true'
				Object.assign(element.style, {
					flexDirection: 'column',
					gap: '2px',
					height: 'auto',
				})
				for (const original of [arrow, palette]) {
					const clone = original.cloneNode(true) as HTMLElement
					clone.classList.remove('lifted', 'following', 'editing')
					element.append(clone)
				}
			}
		}

		/** Options for a swatch zone. Its wrapper isn't a tab stop; its swatches are. */
		zoneOptions(
			zone: SortableZone<ISwatchItem>,
			type: string,
			enabled: boolean,
			transformDraggedElement?: TransformDraggedElementFunction
		) {
			return {
				items: zone.items,
				type,
				dragDisabled: !enabled,
				dropTargetStyle: {},
				zoneTabIndex: -1,
				zoneItemTabIndex: -1,
				// Swatches are all one size, and morphing would undo the lifted column's height.
				morphDisabled: true,
				// A lifted column's centre sits below the key row, so place it by the cursor instead.
				useCursorForDetection: true,
				transformDraggedElement,
			}
		}
	}
</script>

<script lang="ts">
	import SwatchPopover from './swatchPopover.svelte'

	/** Shows `editor`'s popover for the swatch being edited. */
	let { editor }: { editor: SwatchEditor } = $props()
</script>

{#if editor.edit && editor.popover}
	{#key editor.edit}
		{@const edit = editor.edit}
		<SwatchPopover
			anchor={edit.anchor}
			color={editor.popover.color}
			note={editor.popover.note}
			actions={editor.popover.actions}
			oninput={color => editor.input(edit, color)}
			onclose={revert => editor.onPopoverClose(edit, revert)}
		/>
	{/key}
{/if}
