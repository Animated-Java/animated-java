import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { DEFAULT_SEPARATOR, getPaletteImagePath, getTextureImagePath } from '../../atlas'
import { getTargetVersion, translate } from '../../host'
import type { IFoundSource } from '../../packSources'
import { regenerateAllSets, savePackImages } from '../../preview'
import { createPaletteSet, createSetData } from '../../sets'
import type { IPaletteReference } from '../../types'
import ReferencePickerComponent from './referencePicker.svelte'

export interface IReferenceSelection {
	found: IFoundSource
	bases: string[]
	suffixes: string[]
}

function setNameFor(found: IFoundSource): string {
	return found.source.palette_key.replace(/^.*[:/]/, '') || 'permutation_set'
}

/** Creates a reference set from the chosen source, bases and permutations. */
async function createReferenceSet({ found, bases, suffixes }: IReferenceSelection) {
	const { source, atlas, file } = found
	const relative =
		file && Project?.save_path
			? PathModule.relative(PathModule.dirname(Project.save_path), file)
			: undefined
	const reference: IPaletteReference = {
		atlas,
		file,
		relative_file: relative?.replace(/\\/g, '/'),
	}
	if (file) {
		const version = getTargetVersion()
		reference.images = await savePackImages(reference, [
			...bases.map(getTextureImagePath),
			getPaletteImagePath(source.palette_key, version),
			...suffixes.map(suffix => getPaletteImagePath(source.permutations[suffix], version)),
		])
	}
	createPaletteSet(
		setNameFor(found),
		createSetData({
			separator: source.separator ?? DEFAULT_SEPARATOR,
			bases,
			key: { id: source.palette_key },
			permutations: suffixes.map(suffix => ({
				uuid: guid(),
				suffix,
				strip: { id: source.permutations[suffix] },
			})),
			reference,
		})
	)
	void regenerateAllSets()
}

export function openReferencePickerDialog() {
	let selection: IReferenceSelection | undefined

	new SvelteDialog({
		id: 'animated_java:palette_reference_picker',
		title: translate('dialog.reference.title'),
		width: 640,
		component: ReferencePickerComponent,
		props: {
			onchange(next: IReferenceSelection | undefined) {
				selection = next
			},
		},
		disableKeybinds: true,
		onConfirm() {
			if (!selection?.bases.length || !selection.suffixes.length) {
				Blockbench.showQuickMessage(translate('dialog.reference.nothing_selected'))
				return false
			}
			void createReferenceSet(selection)
		},
	}).show()
}
