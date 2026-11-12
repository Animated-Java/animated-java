<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte'
	import type { IPaintContext } from '../paintState'
	import { drawRecolorCanvases, getStripColors, regenerateAllSets } from '../preview'
	import type { PaletteColors } from '../recolor'
	import { editPaletteSet } from '../sets'
	import SwatchEditorPopover, { SwatchEditor } from '../swatches/swatchEditor.svelte'
	import SwatchLineup from '../swatches/swatchLineup.svelte'
	import type { IPalettePermutation, IPaletteSetData } from '../types'

	interface Props {
		/** Re-sent after every edit, so the draft can follow changes made elsewhere, like undo. */
		context: IPaintContext
		/** The permutation shown under the key, or undefined for just the key. */
		shown: string | undefined
	}

	let { context, shown }: Props = $props()

	// Keyed by set in the panel, so this never changes.
	const set = untrack(() => context.set)

	/** The set's data as edited here. Commits replace the set's data with it, as one undo step. */
	let draft = $state<IPaletteSetData>(structuredClone(set.palette_set))
	let syncedJSON = JSON.stringify(set.palette_set)

	const selected = $derived(draft.permutations.find(p => p.uuid === shown))

	let keyColors = $state.raw<PaletteColors | undefined>()
	let paletteColors = $state.raw<Record<string, PaletteColors | undefined>>({})
	let loadToken = 0

	// Pack strips load asynchronously. Only the latest load wins.
	$effect(() => {
		const snapshot = $state.snapshot(draft) as IPaletteSetData
		const token = ++loadToken
		void (async () => {
			const [key, palettes] = await Promise.all([
				getStripColors(snapshot, snapshot.key),
				Promise.all(
					snapshot.permutations.map(async p => [
						p.uuid,
						await getStripColors(snapshot, p.strip),
					])
				),
			])
			if (token !== loadToken) return
			keyColors = key
			paletteColors = Object.fromEntries(palettes)
		})()
	})

	const colorsOf = (permutation: IPalettePermutation): PaletteColors =>
		permutation.strip.colors ?? paletteColors[permutation.uuid] ?? []

	function commit() {
		// The set may be gone, or belong to a project that's no longer open.
		if (!TextureGroup.all.includes(set)) return
		const next = $state.snapshot(draft) as IPaletteSetData
		if (JSON.stringify(next) === JSON.stringify(set.palette_set)) return
		editPaletteSet(set, next)
		void regenerateAllSets()
	}

	const editor = new SwatchEditor({
		data: () => draft,
		selected: () => selected,
		key: () => draft.key.colors ?? keyColors ?? [],
		colorsOf,
		pickOnClick: true,
		oncommit: commit,
		ondiscard: () => queuePreview(set.palette_set),
	})

	// region Live preview
	// While a popover is open, recolors on the model follow the draft, once per frame at most.

	let nextPreview: IPaletteSetData | undefined
	let previewing = false

	async function queuePreview(data: IPaletteSetData) {
		nextPreview = data
		if (previewing) return
		previewing = true
		try {
			while (nextPreview) {
				await new Promise(requestAnimationFrame)
				const data = nextPreview
				nextPreview = undefined
				if (TextureGroup.all.includes(set)) await drawRecolorCanvases(set, data)
			}
		} finally {
			previewing = false
		}
	}

	$effect(() => {
		if (!editor.edit) return
		void queuePreview($state.snapshot(draft) as IPaletteSetData)
	})
	// endregion

	// The set changed elsewhere, like an undo or the Permutation Set dialog: start over from it.
	$effect(() => {
		const data = context.set.palette_set
		untrack(() => {
			const json = JSON.stringify(data)
			if (json === syncedJSON) return
			syncedJSON = json
			editor.dismiss()
			draft = structuredClone(data)
		})
	})

	onMount(() => {
		// The panel hides outside paint mode, but the popover lives under <body>.
		const onSelectMode = () => editor.close()
		Blockbench.on('select_mode', onSelectMode)
		return () => Blockbench.removeListener('select_mode', onSelectMode)
	})

	onDestroy(() => editor.close())
</script>

<SwatchLineup {editor} />
<SwatchEditorPopover {editor} />
