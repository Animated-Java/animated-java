import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { translate } from '../../host'
import { regenerateAllSets } from '../../preview'
import { editPaletteSet, type PaletteSet } from '../../sets'
import type { IPaletteSetData } from '../../types'
import PaletteSetComponent from './paletteSet.svelte'

export function openPaletteSetDialog(set: PaletteSet) {
	let name = set.name
	let data: IPaletteSetData = structuredClone(set.palette_set)

	new SvelteDialog({
		id: 'animated_java:palette_set',
		title: translate('dialog.set.title'),
		width: 1100,
		// Blockbench caps fixed dialogs at 960px; resizable ones can open wider and be dragged wider.
		resizable: 'x',
		component: PaletteSetComponent,
		props: {
			initialName: name,
			initialData: data,
			onchange(nextName: string, nextData: IPaletteSetData) {
				name = nextName
				data = nextData
			},
		},
		disableKeybinds: true,
		onConfirm() {
			editPaletteSet(set, data, name.trim() || set.name)
			void regenerateAllSets()
		},
	}).show()
}
