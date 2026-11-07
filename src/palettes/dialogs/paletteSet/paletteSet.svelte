<script lang="ts" module>
	import { DEFAULT_SEPARATOR, SEPARATOR_MIN_VERSION, supportsSeparator } from '../../atlas'
	import { checkPaletteSet, type IPaletteIssue } from '../../checks'
	import { getTargetVersion, translate } from '../../host'
	import { findPackSources, getPaletteIds } from '../../packSources'
	import {
		decodeDataURL,
		getBasePixels,
		getStripColors,
		pixelsToDataURL,
		renderRecolor,
		type IPixels,
	} from '../../preview'
	import { colorsFromPixels, extractKey, mergeKey, type PaletteColors } from '../../recolor'
	import { getBaseLabel, isPaletteTexture } from '../../sets'
	import type { IPalettePermutation, IPaletteSetData, IPaletteStrip } from '../../types'

	/** Whether previews show recolors or plain bases, remembered between opens of the dialog. */
	let lastApplyPalette = true

	const ISSUE_ICONS: Record<IPaletteIssue['severity'], string> = {
		error: 'error',
		warning: 'warning',
	}

	function toSuffix(fileName: string): string {
		const suffix = fileName
			.replace(/\.png$/i, '')
			.replace(/^.*[:/]/, '')
			.toLowerCase()
			.replace(/[^a-z0-9_.-]/g, '_')
		return suffix || 'palette'
	}

	/** Opens a PNG picker and hands back each file's pixel colors. */
	function importStrips(
		multiple: boolean,
		onload: (name: string, colors: PaletteColors) => void
	) {
		Blockbench.import(
			{
				type: 'PNG',
				extensions: ['png'],
				readtype: 'image',
				multiple,
				resource_id: 'palette',
			},
			async files => {
				for (const file of files) {
					const pixels = await decodeDataURL(String(file.content))
					if (pixels) onload(file.name, colorsFromPixels(pixels.data))
					else
						Blockbench.showQuickMessage(
							translate('dialog.set.unreadable_png', file.name)
						)
				}
			}
		)
	}
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte'
	import {
		dndzone,
		SHADOW_ITEM_MARKER_PROPERTY_NAME,
		type DndEvent,
		type TransformDraggedElementFunction,
	} from 'svelte-dnd-action'
	import { flip } from 'svelte/animate'
	import SwatchPopover from './swatchPopover.svelte'

	interface Props {
		initialName: string
		initialData: IPaletteSetData
		onchange: (name: string, data: IPaletteSetData) => void
	}

	let { initialName, initialData, onchange }: Props = $props()

	let name = $state(untrack(() => initialName))
	let data = $state<IPaletteSetData>(untrack(() => structuredClone(initialData)))

	const isReference = $derived(!!data.reference)
	const version = getTargetVersion()
	const separatorSupported = supportsSeparator(version)

	let selectedUuid = $state<string | undefined>(untrack(() => data.permutations[0]?.uuid))
	let applyPalette = $state(lastApplyPalette)
	$effect(() => {
		lastApplyPalette = applyPalette
	})

	const selected = $derived(
		data.permutations.find(p => p.uuid === selectedUuid) ?? data.permutations[0]
	)

	$effect(() => onchange(name, $state.snapshot(data) as IPaletteSetData))

	let basePixels = $state.raw<Record<string, IPixels | undefined>>({})
	let keyColors = $state.raw<PaletteColors | undefined>()
	let paletteColors = $state.raw<Record<string, PaletteColors | undefined>>({})
	let loaded = $state(false)
	let loadToken = 0

	// Strips and bases can come from packs, so they load asynchronously. Only the latest load wins.
	$effect(() => {
		const snapshot = $state.snapshot(data) as IPaletteSetData
		const token = ++loadToken
		loaded = false
		void (async () => {
			const [bases, key, palettes] = await Promise.all([
				Promise.all(snapshot.bases.map(async b => [b, await getBasePixels(snapshot, b)])),
				getStripColors(snapshot, snapshot.key),
				Promise.all(
					snapshot.permutations.map(async p => [
						p.uuid,
						await getStripColors(snapshot, p.strip),
					])
				),
			])
			if (token !== loadToken) return
			basePixels = Object.fromEntries(bases)
			keyColors = key
			paletteColors = Object.fromEntries(palettes)
			loaded = true
		})()
	})

	const issues = $derived(
		loaded
			? checkPaletteSet({
					version,
					separator: data.separator,
					key: keyColors,
					permutations: data.permutations.map(p => ({
						suffix: p.suffix,
						colors: paletteColors[p.uuid],
					})),
					bases: data.bases.map(base => ({
						name: getBaseLabel(data, base),
						pixels: basePixels[base]?.data,
					})),
				})
			: []
	)

	/** A permutation's colors: stored ones as you edit them, or the loaded pack palette. */
	function colorsOf(permutation: IPalettePermutation): PaletteColors {
		return permutation.strip.colors ?? paletteColors[permutation.uuid] ?? []
	}

	const key = $derived(data.key.colors ?? keyColors ?? [])

	/** The selected palette on `base`, or the plain base when palettes are toggled off. */
	function previewOf(base: string, permutation: IPalettePermutation | undefined, apply: boolean) {
		const pixels = basePixels[base]
		if (!pixels) return undefined
		if (!apply || !permutation || !key.length) return pixelsToDataURL(pixels)
		return pixelsToDataURL(renderRecolor(pixels, key, colorsOf(permutation)))
	}

	/** Key and palette colors paired up, padded to the longer of the two. */
	const lineup = $derived.by(() => {
		const palette = selected ? colorsOf(selected) : []
		return Array.from({ length: Math.max(key.length, palette.length) }, (_, i) => ({
			key: key[i] as string | undefined,
			palette: palette[i] as string | undefined,
		}))
	})

	function baseThumbnail(base: string): string | undefined {
		const pixels = basePixels[base]
		return pixels && pixelsToDataURL(pixels)
	}

	function uniqueSuffix(suffix: string): string {
		const taken = new Set(data.permutations.map(p => p.suffix))
		let candidate = suffix
		for (let i = 2; taken.has(candidate); i++) candidate = `${suffix}_${i}`
		return candidate
	}

	function addPermutation(suffix: string, strip: IPaletteStrip) {
		const permutation: IPalettePermutation = {
			uuid: guid(),
			suffix: uniqueSuffix(suffix),
			strip,
		}
		data.permutations.push(permutation)
		selectedUuid = permutation.uuid
	}

	function removePermutation(permutation: IPalettePermutation) {
		const index = data.permutations.findIndex(p => p.uuid === permutation.uuid)
		data.permutations.splice(index, 1)
		selectedUuid = data.permutations[Math.min(index, data.permutations.length - 1)]?.uuid
	}

	function duplicatePermutation(permutation: IPalettePermutation) {
		addPermutation(permutation.suffix, structuredClone($state.snapshot(permutation.strip)))
	}

	function openAddBaseMenu(event: MouseEvent) {
		const available = Texture.all.filter(
			t => !isPaletteTexture(t) && !t.is_texture_slot && !data.bases.includes(t.uuid)
		)
		if (!available.length) {
			Blockbench.showQuickMessage(translate('dialog.set.no_more_bases'))
			return
		}
		new Menu(
			available.map(texture => ({
				name: texture.name,
				icon: texture.img,
				click: () => data.bases.push(texture.uuid),
			}))
		).open(event)
	}

	function openExtractKeyMenu(event: MouseEvent) {
		const images = data.bases.map(b => basePixels[b]?.data).filter(d => !!d)
		if (!images.length) {
			Blockbench.showQuickMessage(translate('dialog.set.extract_needs_bases'))
			return
		}
		const extracted = extractKey(images)
		new Menu([
			{
				name: translate('dialog.set.extract_replace'),
				icon: 'auto_fix_high',
				click: () => (data.key = { colors: extracted }),
			},
			{
				name: translate('dialog.set.extract_merge'),
				icon: 'playlist_add',
				condition: () => !!keyColors?.length,
				click: () => (data.key = { colors: mergeKey(keyColors ?? [], extracted) }),
			},
		]).open(event)
	}

	/** Lists palette ids from vanilla and the Preview packs, and calls `pick` with the chosen one. */
	async function openPackPaletteMenu(event: MouseEvent, pick: (id: string) => void) {
		const ids = getPaletteIds(await findPackSources())
		if (!ids.length) {
			Blockbench.showQuickMessage(translate('dialog.set.no_pack_palettes'))
			return
		}
		new Menu(ids.map(id => ({ name: id, icon: 'colorize', click: () => pick(id) }))).open(event)
	}

	function openAddPermutationMenu(event: MouseEvent) {
		new Menu([
			{
				name: translate('dialog.set.import_palettes'),
				icon: 'file_upload',
				click: () =>
					importStrips(true, (file, colors) =>
						addPermutation(toSuffix(file), { colors })
					),
			},
			{
				name: translate('dialog.set.duplicate_key'),
				icon: 'content_copy',
				condition: () => !!keyColors?.length,
				click: () => addPermutation('new', { colors: [...(keyColors ?? [])] }),
			},
			{
				name: translate('dialog.set.use_pack_palette'),
				icon: 'colorize',
				click: () =>
					void openPackPaletteMenu(event, id => addPermutation(toSuffix(id), { id })),
			},
		]).open(event)
	}

	/**
	 * Removes a key color, and the color at the same position from every stored palette that lines
	 * up with the key, so they stay aligned. Pack palettes can't change, so the checks flag them.
	 */
	function removeKeyColor(index: number) {
		const length = data.key.colors!.length
		for (const permutation of data.permutations) {
			if (permutation.strip.colors?.length === length)
				permutation.strip.colors.splice(index, 1)
		}
		data.key.colors!.splice(index, 1)
	}

	interface ISwatchEdit {
		kind: 'key' | 'palette'
		index: number
		anchor: HTMLElement
		/** The edited strip as it was when the popover opened, restored by Escape. */
		/** The key and every palette as they were when the popover opened, restored by Escape. */
		original: ISetSnapshot
		permutation?: string
		/** Opened from the add button, for a new key color. */
		adding?: boolean
		/** Palettes that grew along with the key while adding a key color, to follow its color. */
		extended?: string[]
	}

	interface ISetSnapshot {
		key: IPaletteStrip
		strips: Record<string, IPaletteStrip>
	}

	function snapshotStrips(): ISetSnapshot {
		const snapshot = $state.snapshot(data) as IPaletteSetData
		return {
			key: structuredClone(snapshot.key),
			strips: Object.fromEntries(
				snapshot.permutations.map(p => [p.uuid, structuredClone(p.strip)])
			),
		}
	}

	/** Why a reference set's contents can't change, shown instead of acting. */
	function explainLocked() {
		Blockbench.showQuickMessage(translate('dialog.set.reference_locked'), 4000)
	}

	/** Runs `action`, or explains why it can't for a reference set. */
	function unlessReference(action: (event: MouseEvent) => void) {
		return (event: MouseEvent) => (isReference ? explainLocked() : action(event))
	}

	// Raw, so `original` stays a plain snapshot instead of a proxy that could alias the set's data.
	let swatchEdit = $state.raw<ISwatchEdit | undefined>()

	const editedPermutation = $derived(
		swatchEdit?.permutation
			? data.permutations.find(p => p.uuid === swatchEdit!.permutation)
			: undefined
	)

	/** Colors are stored as `#rrggbbaa`; some sources leave the alpha off. */
	const withAlpha = (color: string) => (color.length === 7 ? color + 'ff' : color)

	function openSwatch(event: MouseEvent, kind: ISwatchEdit['kind'], index: number) {
		const anchor = event.currentTarget as HTMLElement
		if (swatchEdit?.anchor === anchor) {
			swatchEdit = undefined
			return
		}
		swatchEdit = {
			kind,
			index,
			anchor,
			original: snapshotStrips(),
			permutation: kind === 'palette' ? selected!.uuid : undefined,
		}
	}

	/**
	 * Appends a key color and opens it for editing. Palettes that line up with the key get the same
	 * color at the new position, so the new shade maps to itself until it's changed.
	 */
	function addKeyColor(event: MouseEvent) {
		const anchor = event.currentTarget as HTMLElement
		if (swatchEdit?.anchor === anchor) {
			swatchEdit = undefined
			return
		}
		const original = snapshotStrips()
		if (!data.key.colors) {
			// A pack key; the popover offers to copy it into the set first.
			swatchEdit = { kind: 'key', index: key.length, anchor, original, adding: true }
			return
		}
		const length = data.key.colors.length
		const color = withAlpha(key.at(-1) ?? '#808080ff')
		const extended = data.permutations.filter(p => p.strip.colors?.length === length)
		for (const permutation of extended) permutation.strip.colors!.push(color)
		data.key.colors.push(color)
		swatchEdit = {
			kind: 'key',
			index: length,
			anchor,
			original,
			adding: true,
			extended: extended.map(p => p.uuid),
		}
	}

	// A different permutation has its own swatches, so close the popover when the selection moves.
	$effect(() => {
		if (swatchEdit?.permutation && swatchEdit.permutation !== selected?.uuid) {
			swatchEdit = undefined
		}
	})

	/** The popover's color, note and actions for the swatch being edited. */
	const swatchPopover = $derived.by(() => {
		if (!swatchEdit) return undefined
		const { kind, index } = swatchEdit
		if (isReference) {
			return { color: undefined, note: translate('dialog.set.reference_locked'), actions: [] }
		}
		if (kind === 'key') {
			if (!data.key.colors) {
				return {
					color: undefined,
					note: translate('dialog.set.pack_key_note', data.key.id ?? ''),
					actions: [
						{
							label: translate('dialog.set.copy_key_to_edit'),
							icon: 'content_copy',
							onclick: () => {
								data.key = { colors: key.map(withAlpha) }
								// Opened from the add button: adding is a separate click once copied.
								if (swatchEdit?.adding) swatchEdit = undefined
							},
						},
					],
				}
			}
			return {
				color: data.key.colors[index],
				note: undefined,
				actions: [
					{
						label: translate('dialog.set.remove_key_color'),
						icon: 'delete',
						onclick: () => {
							swatchEdit = undefined
							removeKeyColor(index)
						},
					},
				],
			}
		}
		const permutation = editedPermutation
		if (!permutation) return undefined
		if (!permutation.strip.colors) {
			return {
				color: undefined,
				note: translate('dialog.set.pack_palette_note', permutation.strip.id ?? ''),
				actions: [
					{
						label: translate('dialog.set.copy_palette_to_edit'),
						icon: 'content_copy',
						onclick: () =>
							(permutation.strip = { colors: colorsOf(permutation).map(withAlpha) }),
					},
				],
			}
		}
		const keyColor = key[index] as string | undefined
		const actions = keyColor
			? [
					{
						label: translate('dialog.set.reset_to_key_color'),
						icon: 'restart_alt',
						onclick: () => setPaletteColor(permutation, index, withAlpha(keyColor)),
					},
				]
			: [
					{
						label: translate('dialog.set.remove_palette_color'),
						icon: 'delete',
						onclick: () => {
							swatchEdit = undefined
							permutation.strip.colors!.splice(index, 1)
						},
					},
				]
		return {
			color: permutation.strip.colors[index] ?? withAlpha(keyColor ?? '#ffffff'),
			note: undefined,
			actions,
		}
	})

	/** Sets a stored palette color, filling any gap before it with white. */
	function setPaletteColor(permutation: IPalettePermutation, index: number, color: string) {
		const colors = permutation.strip.colors!
		while (colors.length <= index) colors.push('#ffffffff')
		colors[index] = color
	}

	/** Applies a picked color, but only for the edit it came from, never a later one. */
	function onSwatchInput(edit: ISwatchEdit, color: string) {
		if (edit !== swatchEdit) return
		if (edit.kind === 'palette') {
			if (editedPermutation) setPaletteColor(editedPermutation, edit.index, color)
			return
		}
		data.key.colors![edit.index] = color
		for (const uuid of edit.extended ?? []) {
			const colors = data.permutations.find(p => p.uuid === uuid)?.strip.colors
			if (colors) colors[edit.index] = color
		}
	}

	function onSwatchClose(edit: ISwatchEdit, revert: boolean) {
		if (edit !== swatchEdit) return
		if (revert) {
			const { key: originalKey, strips } = structuredClone(edit.original)
			data.key = originalKey
			for (const permutation of data.permutations) {
				if (strips[permutation.uuid]) permutation.strip = strips[permutation.uuid]
			}
		}
		swatchEdit = undefined
	}

	// region Undo history
	// The dialog has its own history: Blockbench's Undo only sees the set once it's confirmed.

	/** Changes closer together than this undo as one step, like typing or dragging a color. */
	const MERGE_MS = 500

	/** The name and data as JSON: one state in the history. */
	const currentState = () =>
		JSON.stringify({ name, data: $state.snapshot(data) as IPaletteSetData })

	let past: string[] = []
	let future: string[] = []
	/** The latest state the history knows about. */
	let recorded = untrack(currentState)
	let mergeTimer: ReturnType<typeof setTimeout> | undefined

	// Each change after a pause starts a new undo step, holding the state from before it.
	$effect(() => {
		const state = currentState()
		if (state === recorded) return
		if (!mergeTimer) {
			past.push(recorded)
			future = []
		}
		clearTimeout(mergeTimer)
		mergeTimer = setTimeout(() => (mergeTimer = undefined), MERGE_MS)
		recorded = state
	})

	function restore(state: string) {
		clearTimeout(mergeTimer)
		mergeTimer = undefined
		swatchEdit = undefined
		recorded = state
		const parsed = JSON.parse(state) as { name: string; data: IPaletteSetData }
		name = parsed.name
		data = parsed.data
	}

	function undo() {
		const state = past.pop()
		if (state === undefined) return
		future.push(currentState())
		restore(state)
	}

	function redo() {
		const state = future.pop()
		if (state === undefined) return
		past.push(currentState())
		restore(state)
	}

	onMount(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			// Only while this dialog is on top, not a picker or another dialog over it.
			if (Dialog.open?.id !== 'animated_java:palette_set') return
			const redoKey =
				BarItems.redo.keybind.isTriggered(event) ||
				(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z')
			const undoKey = !redoKey && BarItems.undo.keybind.isTriggered(event)
			if (!undoKey && !redoKey) return
			event.preventDefault()
			event.stopPropagation()
			if (undoKey) undo()
			else redo()
		}
		window.addEventListener('keydown', onKeyDown, true)
		return () => {
			window.removeEventListener('keydown', onKeyDown, true)
			clearTimeout(mergeTimer)
		}
	})
	// endregion

	function openKeyMenu(event: MouseEvent) {
		new Menu([
			{
				name: translate('dialog.set.import_key'),
				icon: 'file_upload',
				click: () => importStrips(false, (_, colors) => (data.key = { colors })),
			},
			{
				name: translate('dialog.set.use_pack_palette'),
				icon: 'colorize',
				click: () => void openPackPaletteMenu(event, id => (data.key = { id })),
			},
		]).open(event)
	}

	// region Drag to reorder

	const FLIP_DURATION = 150

	/** A swatch in a drag zone. `id` is its index in the strip when the drag started. */
	interface ISwatchItem {
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

	/**
	 * A drag-to-reorder zone over a list in the set. Mid-drag it shows the library's working order;
	 * on drop it hands the final order to `reorder` and goes back to showing the set.
	 */
	class SortableZone<T extends { id: string }> {
		dragged = $state.raw<T[]>()

		constructor(
			private readonly source: () => T[],
			private readonly reorder: (items: T[]) => void
		) {}

		get items() {
			return this.dragged ?? this.source()
		}

		consider = (event: CustomEvent<DndEvent<T>>) => {
			// The popover's anchor and index don't follow a drag.
			swatchEdit = undefined
			this.dragged = event.detail.items
		}

		finalize = (event: CustomEvent<DndEvent<T>>) => {
			this.dragged = undefined
			this.reorder(event.detail.items)
		}
	}

	/**
	 * Reorders the key, and each stored palette that lines up with it, so every key color keeps its
	 * palette color. Same rule as `removeKeyColor`.
	 */
	function reorderKey(items: ISwatchItem[]) {
		const order = getNewOrder(items)
		const colors = data.key.colors
		if (!order || !colors) return
		for (const permutation of data.permutations) {
			const palette = permutation.strip.colors
			if (palette?.length === colors.length)
				permutation.strip.colors = order.map(i => palette[i])
		}
		data.key.colors = order.map(i => colors[i])
	}

	/** Reorders only the selected palette, remapping its colors onto different key colors. */
	function reorderPalette(items: ISwatchItem[]) {
		const order = getNewOrder(items)
		const strip = selected?.strip
		const colors = strip?.colors
		if (!order || !strip || !colors) return
		strip.colors = order.map(i => colors[i])
	}

	const keyEditable = $derived(!isReference && !!data.key.colors)
	const paletteEditable = $derived(!isReference && !!selected?.strip.colors)

	/** One key zone's working order, for the other key zone to mirror without the placeholder. */
	const mirror = (items: ISwatchItem[] | undefined): ISwatchItem[] | undefined =>
		items?.map(({ id, color }) => ({ id, color }))

	const keyChipZone = new SortableZone<ISwatchItem>(
		(): ISwatchItem[] => mirror(keyLineupZone.dragged) ?? toSwatchItems(key),
		reorderKey
	)
	const keyLineupZone = new SortableZone<ISwatchItem>(
		(): ISwatchItem[] => mirror(keyChipZone.dragged) ?? toSwatchItems(key),
		reorderKey
	)

	/** The key's working order while either key zone is mid-drag. */
	const keyDrag = $derived(keyLineupZone.dragged ?? keyChipZone.dragged)
	/** Where the dragged key color would land, and its id, mid-drag. */
	const keyDropIndex = $derived(
		keyDrag?.findIndex(item => item[SHADOW_ITEM_MARKER_PROPERTY_NAME]) ?? -1
	)
	const draggedKeyId = $derived(keyDrag?.[keyDropIndex]?.id)

	/**
	 * Whether the selected palette moves with its key colors: only when `reorderKey` would move it,
	 * as a stored palette that lines up with the key.
	 */
	const paletteLinesUp = $derived(
		!!selected?.strip.colors && selected.strip.colors.length === key.length
	)
	/** Lineup drags lift the whole column; chip drags highlight it, as it's out of reach. */
	const columnLifted = $derived(paletteLinesUp && !!keyLineupZone.dragged)
	const columnHighlighted = $derived(paletteLinesUp && !!keyChipZone.dragged)

	function paletteItems(): ISwatchItem[] {
		const colors = selected ? colorsOf(selected) : []
		if (!keyDrag || !paletteLinesUp) return toSwatchItems(colors)
		return keyDrag.map(({ id }) => ({ id, color: colors[Number(id)] }))
	}

	let lineupElement = $state<HTMLElement>()

	/**
	 * Grows the lineup's dragged key swatch into its whole column, so the arrow and palette color
	 * under it travel with the cursor. The zone calls this on every move; it builds once.
	 */
	const liftColumn: TransformDraggedElementFunction = (element, item) => {
		if (!element || !item || !paletteLinesUp || element.dataset.column) return
		const arrow = lineupElement?.querySelector('.arrow')
		const palette = lineupElement?.querySelector(`.palette-swatch[data-id="${item.id}"]`)
		if (!arrow || !palette) return
		element.dataset.column = 'true'
		Object.assign(element.style, { flexDirection: 'column', gap: '2px', height: 'auto' })
		for (const original of [arrow, palette]) {
			const clone = original.cloneNode(true) as HTMLElement
			clone.classList.remove('lifted', 'following', 'editing')
			element.append(clone)
		}
	}

	const paletteZone = new SortableZone(paletteItems, reorderPalette)
	const baseZone = new SortableZone(
		() => data.bases.map(base => ({ id: base })),
		items => {
			if (items.some((item, i) => item.id !== data.bases[i])) {
				data.bases = items.map(item => item.id)
			}
		}
	)
	const permutationZone = new SortableZone(
		() => data.permutations.map(permutation => ({ id: permutation.uuid, permutation })),
		items => {
			if (items.some((item, i) => item.id !== data.permutations[i].uuid)) {
				data.permutations = items.map(item => item.permutation)
			}
		}
	)

	/**
	 * Lets Enter and Space click a `role="button"` element inside a drag zone. Draggables can't be
	 * real buttons: the zone won't start a drag from an element with a `value`, which buttons have.
	 * Bind it with `onkeydowncapture`: Svelte delegates plain `onkeydown` to the root, which the
	 * zone's own key handler would reach first, claiming the keys for keyboard dragging.
	 */
	function clickOnKey(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return
		event.preventDefault()
		event.stopPropagation()
		;(event.currentTarget as HTMLElement).click()
	}

	/** Options shared by the swatch zones, whose wrappers aren't tab stops; their swatches are. */
	const swatchZoneOptions = (
		zone: SortableZone<ISwatchItem>,
		type: string,
		enabled: boolean,
		transformDraggedElement?: TransformDraggedElementFunction
	) => ({
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
	})
	// endregion
</script>

<div class="dialog-container">
	{#if isReference}
		<div class="notice">
			<i class="material-icons icon">link</i>
			<span>
				{translate(
					'dialog.set.reference_notice',
					data.reference!.atlas,
					data.reference!.file ?? translate('dialog.set.reference_from_packs')
				)}
			</span>
		</div>
	{/if}

	<div class="main">
		<section class="setup">
			<div class="name-row">
				<label class="field">
					<span>{translate('dialog.set.name')}</span>
					<input type="text" class="dark_bordered" bind:value={name} />
				</label>
				<label class="field">
					<span>{translate('dialog.set.separator')}</span>
					<input
						type="text"
						class="dark_bordered mono"
						bind:value={data.separator}
						readonly={isReference}
						onclick={isReference ? explainLocked : undefined}
						disabled={!isReference &&
							!separatorSupported &&
							data.separator === DEFAULT_SEPARATOR}
						title={isReference
							? translate('dialog.set.reference_locked')
							: separatorSupported
								? undefined
								: translate(
										'dialog.set.separator_old_version',
										SEPARATOR_MIN_VERSION
									)}
					/>
				</label>
			</div>
			<div class="field">
				<span>{translate('dialog.set.key')}</span>
				{#if data.key.id}
					<span class="key-id muted mono" title={data.key.id}>{data.key.id}</span>
				{/if}
				<div class="chips">
					<div class="key-swatches">
						<div
							class="swatch-zone"
							use:dndzone={swatchZoneOptions(
								keyChipZone,
								'palette-key-chips',
								keyEditable
							)}
							onconsider={keyChipZone.consider}
							onfinalize={keyChipZone.finalize}
						>
							{#each keyChipZone.items as item (item.id)}
								<span class="swatch-item">
									<span
										class="swatch key-swatch"
										role="button"
										tabindex="0"
										onkeydowncapture={clickOnKey}
										class:editing={swatchEdit?.kind === 'key' &&
											swatchEdit.index === Number(item.id)}
										class:following={!!keyLineupZone.dragged &&
											item.id === draggedKeyId}
										style:background={item.color}
										title={translate('dialog.set.key_color', item.color)}
										onclick={event => openSwatch(event, 'key', Number(item.id))}
									></span>
								</span>
							{/each}
						</div>
						<button
							class="swatch add"
							class:locked={isReference}
							class:editing={swatchEdit?.adding}
							title={translate('dialog.set.add_key_color')}
							onclick={unlessReference(addKeyColor)}
						>
							<i class="material-icons">add</i>
						</button>
					</div>
					<button
						class="tool"
						class:locked={isReference}
						title={translate('dialog.set.extract_key')}
						onclick={unlessReference(openExtractKeyMenu)}
					>
						<i class="material-icons icon">auto_fix_high</i>
					</button>
					<button
						class="tool"
						class:locked={isReference}
						title={translate('dialog.set.change_key')}
						onclick={unlessReference(openKeyMenu)}
					>
						<i class="material-icons icon">edit</i>
					</button>
				</div>
			</div>
		</section>

		<section class="bases">
			<div class="list-header">
				<div>
					{translate('dialog.set.bases')}
					<span class="muted">({data.bases.length})</span>
				</div>
				<div class="spacer"></div>
				<button
					class="tool"
					class:locked={isReference}
					title={translate('dialog.set.add_base')}
					onclick={unlessReference(openAddBaseMenu)}
				>
					<i class="material-icons icon">add</i>
				</button>
			</div>
			<ul
				class="list bases"
				use:dndzone={{
					items: baseZone.items,
					type: 'palette-bases',
					flipDurationMs: FLIP_DURATION,
					dropTargetStyle: {},
				}}
				onconsider={baseZone.consider}
				onfinalize={baseZone.finalize}
			>
				{#each baseZone.items as { id: base } (base)}
					<li class="row static" animate:flip={{ duration: FLIP_DURATION }}>
						{#if baseThumbnail(base)}
							<img class="thumbnail" src={baseThumbnail(base)} alt="" />
						{:else}
							<span class="thumbnail"></span>
						{/if}
						<span class="grow" title={base}>{getBaseLabel(data, base)}</span>
						<button
							class="tool"
							title={translate('dialog.set.remove')}
							onclick={() => (data.bases = data.bases.filter(b => b !== base))}
						>
							<i class="material-icons icon">delete</i>
						</button>
					</li>
				{:else}
					<div class="empty">{translate('dialog.set.no_bases')}</div>
				{/each}
			</ul>
		</section>

		<section class="browser">
			<div class="list-header">
				<div>
					{translate('dialog.set.permutations')}
					<span class="muted">({data.permutations.length})</span>
				</div>
				<div class="spacer"></div>
				<button
					class="tool"
					class:locked={isReference}
					title={translate('dialog.set.add_permutation')}
					onclick={unlessReference(openAddPermutationMenu)}
				>
					<i class="material-icons icon">add</i>
				</button>
			</div>
			<ul
				class="list permutations"
				use:dndzone={{
					items: permutationZone.items,
					type: 'palette-permutations',
					flipDurationMs: FLIP_DURATION,
					dropTargetStyle: {},
					zoneItemTabIndex: -1,
				}}
				onconsider={permutationZone.consider}
				onfinalize={permutationZone.finalize}
			>
				{#each permutationZone.items as { id, permutation } (id)}
					<li animate:flip={{ duration: FLIP_DURATION }}>
						<div
							class="row permutation"
							class:selected={selected?.uuid === permutation.uuid}
							role="button"
							tabindex="0"
							onclick={() => (selectedUuid = permutation.uuid)}
							onkeydowncapture={clickOnKey}
						>
							{#if data.bases[0] && previewOf(data.bases[0], permutation, true)}
								<img
									class="thumbnail"
									src={previewOf(data.bases[0], permutation, true)}
									alt=""
								/>
							{:else}
								<span class="thumbnail"></span>
							{/if}
							<span class="grow mono">{permutation.suffix}</span>
							<span class="strip">
								{#each colorsOf(permutation) as color, i (i)}
									<span style:background={color}></span>
								{/each}
							</span>
						</div>
					</li>
				{:else}
					<div class="empty">{translate('dialog.set.no_permutations')}</div>
				{/each}
			</ul>
		</section>

		<section class="detail" class:active={selected}>
			{#if selected}
				<div class="list-header">
					<input
						type="text"
						class="dark_bordered mono suffix"
						bind:value={selected.suffix}
						readonly={isReference}
						onclick={isReference ? explainLocked : undefined}
						title={isReference ? translate('dialog.set.reference_locked') : undefined}
						aria-label={translate('dialog.set.suffix')}
					/>
					<span class="pill mono" title={selected.strip.id}>
						{selected.strip.id ?? translate('dialog.set.stored_colors')}
					</span>
					<div class="spacer"></div>
					<button
						class="tool"
						class:locked={isReference}
						title={translate('dialog.set.duplicate_permutation')}
						onclick={unlessReference(() => duplicatePermutation(selected))}
					>
						<i class="material-icons icon">content_copy</i>
					</button>
					<button
						class="tool"
						title={translate('dialog.set.remove')}
						onclick={() => removePermutation(selected)}
					>
						<i class="material-icons icon">delete</i>
					</button>
				</div>

				<div class="lineup-wrap">
					<div class="lineup" bind:this={lineupElement}>
						<div class="lineup-row">
							<span class="lineup-label">{translate('dialog.set.key')}</span>
							<div
								class="swatch-zone"
								use:dndzone={swatchZoneOptions(
									keyLineupZone,
									'palette-key-lineup',
									keyEditable,
									liftColumn
								)}
								onconsider={keyLineupZone.consider}
								onfinalize={keyLineupZone.finalize}
							>
								{#each keyLineupZone.items as item (item.id)}
									<span class="swatch-item">
										<span
											class="swatch key-swatch"
											role="button"
											tabindex="0"
											onkeydowncapture={clickOnKey}
											class:editing={swatchEdit?.kind === 'key' &&
												swatchEdit.index === Number(item.id)}
											class:following={!!keyChipZone.dragged &&
												item.id === draggedKeyId}
											style:background={item.color}
											title={translate('dialog.set.key_color', item.color)}
											onclick={event =>
												openSwatch(event, 'key', Number(item.id))}
										></span>
									</span>
								{/each}
							</div>
							{#each lineup.slice(key.length) as _, offset (offset)}
								<span class="swatch missing"></span>
							{/each}
							<button
								class="swatch add"
								class:locked={isReference}
								class:editing={swatchEdit?.adding}
								title={translate('dialog.set.add_key_color')}
								onclick={unlessReference(addKeyColor)}
							>
								<i class="material-icons">add</i>
							</button>
						</div>
						<div class="lineup-row">
							<span class="lineup-label"></span>
							{#each lineup as _, i (i)}
								<span
									class="arrow"
									class:lifted={columnLifted && i === keyDropIndex}
									><i class="material-icons">south</i></span
								>
							{/each}
						</div>
						<div class="lineup-row">
							<span class="lineup-label mono">{selected.suffix}</span>
							<div
								class="swatch-zone"
								use:dndzone={swatchZoneOptions(
									paletteZone,
									'palette-palette-lineup',
									paletteEditable
								)}
								onconsider={paletteZone.consider}
								onfinalize={paletteZone.finalize}
							>
								{#each paletteZone.items as item, position (item.id)}
									<span class="swatch-item">
										<span
											class="swatch palette-swatch"
											role="button"
											tabindex="0"
											onkeydowncapture={clickOnKey}
											class:editing={swatchEdit?.kind === 'palette' &&
												swatchEdit.index === Number(item.id)}
											class:extra={position >= key.length}
											class:lifted={columnLifted && item.id === draggedKeyId}
											class:following={columnHighlighted &&
												item.id === draggedKeyId}
											data-id={item.id}
											style:background={item.color}
											title={translate(
												'dialog.set.palette_color',
												item.color
											)}
											onclick={event =>
												openSwatch(event, 'palette', Number(item.id))}
										></span>
									</span>
								{/each}
							</div>
							{#each lineup.slice(paletteZone.items.length) as _, offset (offset)}
								{@const index = paletteZone.items.length + offset}
								<button
									class="swatch missing"
									class:editing={swatchEdit?.kind === 'palette' &&
										swatchEdit.index === index}
									title={translate('dialog.set.palette_color_missing')}
									onclick={event => openSwatch(event, 'palette', index)}
								></button>
							{/each}
						</div>
					</div>
				</div>

				<div class="list-header">
					<div>{translate('dialog.set.preview')}</div>
					<div class="spacer"></div>
					<label class="toggle" for="palette_set_apply_palette">
						<input
							id="palette_set_apply_palette"
							type="checkbox"
							bind:checked={applyPalette}
						/>
						{translate('dialog.set.apply_palette')}
					</label>
				</div>
				<div class="previews">
					{#each data.bases as base (base)}
						<figure>
							{#if previewOf(base, selected, applyPalette)}
								<img src={previewOf(base, selected, applyPalette)} alt="" />
							{:else}
								<span class="preview-empty"></span>
							{/if}
							<figcaption class="mono">
								{applyPalette
									? getBaseLabel(data, base) + data.separator + selected.suffix
									: getBaseLabel(data, base)}
							</figcaption>
						</figure>
					{:else}
						<div class="empty">{translate('dialog.set.no_bases')}</div>
					{/each}
				</div>
			{:else}
				<div class="empty detail-empty">{translate('dialog.set.preview_empty')}</div>
			{/if}
		</section>
	</div>

	{#if swatchEdit && swatchPopover}
		{#key swatchEdit}
			{@const edit = swatchEdit}
			<SwatchPopover
				anchor={swatchEdit.anchor}
				color={swatchPopover.color}
				note={swatchPopover.note}
				actions={swatchPopover.actions}
				oninput={color => onSwatchInput(edit, color)}
				onclose={revert => onSwatchClose(edit, revert)}
			/>
		{/key}
	{/if}

	{#if issues.length}
		<ul class="issues">
			{#each issues as issue, i (i)}
				<li class={issue.severity}>
					<i class="material-icons icon">{ISSUE_ICONS[issue.severity]}</i>
					<span>{translate('issue.' + issue.code, ...issue.args)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dialog-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: min(74vh, 700px);
		padding: 0 16px 8px;
		overflow: hidden;
	}
	.name-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 64px;
		gap: 8px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.field > span {
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
	.chips {
		display: flex;
		align-items: center;
		gap: 4px;
		min-height: 30px;
		overflow-x: auto;
	}
	.notice {
		display: flex;
		flex: none;
		gap: 8px;
		align-items: center;
		color: var(--color-subtle_text);
		font-size: 0.9em;
		overflow-wrap: anywhere;
	}
	.main {
		flex: 1 1 0;
		min-height: 0;
		display: grid;
		grid-template-columns: 250px 260px minmax(0, 1fr);
		grid-template-rows: auto minmax(0, 1fr);
		gap: 14px;
	}
	.setup {
		grid-column: 1 / 3;
	}
	.detail {
		grid-column: 3;
		grid-row: 1 / 3;
	}
	section {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		gap: 6px;
	}
	.list-header {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 30px;
	}
	.spacer,
	.grow {
		flex-grow: 1;
		min-width: 0;
	}
	.grow {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 4px;
		list-style: none;
		background: var(--color-back);
		border-radius: 6px;
		overflow-x: hidden;
		overflow-y: auto;
	}
	.list.bases,
	.list.permutations {
		flex: 1 1 0;
		min-height: 0;
	}
	.row.static {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 2px 2px 2px 6px;
		border-radius: 4px;
		min-width: 0;
		flex: none;
	}
	.row.static:hover {
		background: var(--color-button);
	}
	/* Reference sets can't change these; clicking explains why */
	.locked {
		opacity: 0.45;
	}
	input[readonly] {
		cursor: default;
	}
	.row.permutation {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-width: 0;
		height: auto;
		margin: 0;
		padding: 3px 6px;
		border: none;
		border-radius: 4px;
		background: none;
		box-shadow: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	.row.permutation:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
	.row.permutation:hover {
		background: var(--color-button);
	}
	.row.permutation.selected {
		position: relative;
		background: var(--color-accent);
		color: var(--color-accent_text);
	}
	.row.permutation.selected .strip {
		outline: 1px solid color-mix(in srgb, var(--color-accent_text) 50%, transparent);
	}
	.detail {
		padding: 6px;
		border: 1px solid transparent;
		border-radius: 8px;
	}
	.detail.active {
		border-color: var(--color-accent);
	}
	.thumbnail {
		width: 24px;
		height: 24px;
		flex: none;
		image-rendering: pixelated;
		background: var(--color-dark);
		border-radius: 2px;
	}
	.strip {
		display: flex;
		flex: none;
		height: 14px;
		max-width: 96px;
		border-radius: 3px;
		overflow: hidden;
	}
	.strip span {
		width: 8px;
		flex: 0 1 8px;
		min-width: 1px;
	}
	.key-id {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.key-swatches {
		display: flex;
		flex-grow: 1;
		gap: 3px;
		min-width: 0;
		overflow-x: auto;
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
	.suffix {
		width: 180px;
		flex: none;
	}
	.pill {
		font-size: 0.8em;
		padding: 1px 6px;
		border-radius: 3px;
		background: var(--color-back);
		color: var(--color-subtle_text);
		max-width: 260px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mono {
		font-family: var(--font-code, monospace);
		font-size: 14px;
	}
	.muted {
		color: var(--color-subtle_text);
		font-size: 0.9em;
	}
	.empty {
		color: var(--color-subtle_text);
		font-style: italic;
		text-align: center;
		padding: 12px;
	}
	.detail-empty {
		margin: auto;
	}
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
		font-size: 0.85em;
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
	.swatch {
		display: block;
		width: 28px;
		flex: none;
		min-width: 0;
		height: 26px;
		margin: 0;
		padding: 0;
		border: none;
		border-radius: 3px;
		box-shadow: none;
		cursor: pointer;
	}
	.swatch.editing,
	.swatch.following,
	.swatch:hover:not(:disabled),
	.swatch:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
	.swatch:disabled {
		cursor: default;
	}
	.swatch.add {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: 1px dashed var(--color-subtle_text);
		color: var(--color-subtle_text);
	}
	.swatch.add i {
		font-size: 16px;
		margin: 0;
	}
	.swatch.missing {
		background: none;
		border: 1px dashed var(--color-subtle_text);
	}
	/* Palette colors past the end of the key make Minecraft skip the palette */
	/* Travelling with a dragged key swatch, so the column's real cells leave a gap */
	.lifted {
		visibility: hidden;
	}
	.swatch.extra {
		outline: 2px solid var(--color-error, #ff5252);
		outline-offset: -2px;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}
	.previews {
		flex: 1 1 0;
		min-height: 0;
		overflow: auto;
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		gap: 14px;
		padding: 12px;
		background: var(--color-back);
		border-radius: 6px;
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	figure img,
	.preview-empty {
		display: block;
		width: 160px;
		height: 160px;
		image-rendering: pixelated;
		object-fit: contain;
		background: repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 0 0 / 16px 16px;
		border-radius: 3px;
	}
	figcaption {
		color: var(--color-subtle_text);
		font-size: 0.85em;
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.issues {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 80px;
		overflow-y: auto;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.9em;
		flex: none;
	}
	.issues li {
		display: flex;
		gap: 6px;
		align-items: flex-start;
	}
	.issues .icon {
		font-size: 18px;
	}
	.issues .error .icon {
		color: var(--color-error, #ff5252);
	}
	.issues .warning .icon {
		color: var(--color-warning, #f0b35c);
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
		flex: none;
	}
	button.tool:hover {
		color: var(--color-light);
	}
	button.tool i {
		font-size: 20px;
		line-height: 28px;
		height: 28px;
	}
</style>
