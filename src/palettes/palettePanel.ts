/**
 * Palette panel actions: load a Permutation Set's key or palette into Blockbench's palette, and
 * save Blockbench's palette into a set as a permutation.
 */
import { registerDeletableHandlerPatch, registerPatch } from 'blockbench-patch-manager'
import { toSuffix, uniqueSuffix } from './checks'
import { isEnabled, translate } from './host'
import { getStripColors, regenerateAllSets } from './preview'
import { fromPanelColor, toPanelColor } from './recolor'
import { editPaletteSet, getPaletteSets, isReferenceSet, type PaletteSet } from './sets'
import type { IPaletteStrip } from './types'

/** The parts of Blockbench's ColorPanel the Palette panel uses. Its types leave them out. */
interface IPalettePanel {
	palette: string[]
	saveLocalStorages(): void
}

const getPanel = () => ColorPanel as unknown as IPalettePanel

const getEditableSets = () => getPaletteSets().filter(set => !isReferenceSet(set))

/** Replaces Blockbench's palette with a strip's colors. Returns false if the strip can't be read. */
export async function loadStripIntoPalette(set: PaletteSet, strip: IPaletteStrip) {
	const colors = await getStripColors(set.palette_set, strip)
	if (!colors) return false
	const panel = getPanel()
	panel.palette.splice(0, Infinity, ...colors.map(toPanelColor))
	panel.saveLocalStorages()
	return true
}

/**
 * Saves Blockbench's palette into `set`, replacing permutation `target`'s colors or, if unset,
 * adding a permutation named after `suffix`. Returns why it couldn't, or undefined once saved.
 */
export async function savePaletteToSet(
	set: PaletteSet,
	target: string | undefined,
	suffix = 'palette'
): Promise<string | undefined> {
	const colors = getPanel().palette.map(fromPanelColor)
	if (colors.some(color => color === undefined)) return translate('palette_panel.invalid_color')
	const key = await getStripColors(set.palette_set, set.palette_set.key)
	if (!key) return translate('palette_panel.key_unreadable')
	if (!key.length) return translate('issue.no_key')
	if (colors.length !== key.length) {
		return translate('palette_panel.length', String(colors.length), String(key.length))
	}

	// Cloned after the await, so edits made while the key loaded aren't lost.
	const data = structuredClone(set.palette_set)
	const strip: IPaletteStrip = { colors: colors as string[] }
	if (target) {
		const permutation = data.permutations.find(p => p.uuid === target)
		if (!permutation) return translate('palette_panel.permutation_missing')
		permutation.strip = strip
	} else {
		const taken = data.permutations.map(p => p.suffix)
		data.permutations.push({
			uuid: guid(),
			suffix: uniqueSuffix(toSuffix(suffix), taken),
			strip,
		})
	}
	editPaletteSet(set, data)
	await regenerateAllSets()
}

function confirmReplace(): Promise<boolean> {
	if (!getPanel().palette.length) return Promise.resolve(true)
	return new Promise(resolve => {
		Blockbench.showMessageBox(
			{ translateKey: 'load_palette', buttons: ['dialog.confirm', 'dialog.cancel'] },
			button => resolve(button === 0)
		)
	})
}

async function load(set: PaletteSet, strip: IPaletteStrip) {
	if (!(await confirmReplace())) return
	if (!(await loadStripIntoPalette(set, strip))) {
		Blockbench.showQuickMessage(translate('palette_panel.strip_unreadable'), 3000)
	}
}

async function save(set: PaletteSet, target?: string, suffix?: string) {
	const error = await savePaletteToSet(set, target, suffix)
	if (error) {
		Blockbench.showMessageBox({ title: translate('palette_panel.save.name'), message: error })
	} else {
		Blockbench.showQuickMessage(translate('palette_panel.saved', set.name), 2000)
	}
}

function promptNewPermutation(set: PaletteSet) {
	void Blockbench.textPrompt(translate('dialog.set.suffix'), 'palette', suffix => {
		void save(set, undefined, suffix)
	})
}

/** Opens under the clicked button, or at the mouse when run from a keybind or the action search. */
function openMenu(event: Event | undefined, items: MenuItem[]) {
	const target = event?.target
	const fromButton =
		target instanceof HTMLElement && target.isConnected && !(event instanceof KeyboardEvent)
	// Blockbench accepts 'mouse' here, but its generated types predate that.
	new Menu(items).open(fromButton ? target : ('mouse' as unknown as MouseEvent))
}

/** Each set, with its key and permutations to load. */
function loadMenuItems(): MenuItem[] {
	return getPaletteSets().map(set => {
		const { key, permutations } = set.palette_set
		return {
			name: set.name,
			icon: 'palette',
			children: [
				{
					name: translate('dialog.set.key'),
					icon: 'key',
					click: () => void load(set, key),
				},
				...(permutations.length ? ['_' as const] : []),
				...permutations.map(p => ({
					name: p.suffix,
					icon: 'texture',
					click: () => void load(set, p.strip),
				})),
			],
		}
	})
}

/** Each project set, with a new permutation and its permutations to overwrite. */
function saveMenuItems(): MenuItem[] {
	return getEditableSets().map(set => {
		const { permutations } = set.palette_set
		return {
			name: set.name,
			icon: 'palette',
			children: [
				{
					name: translate('palette_panel.save.new_permutation'),
					icon: 'add',
					click: () => promptNewPermutation(set),
				},
				...(permutations.length ? ['_' as const] : []),
				...permutations.map(p => ({
					name: p.suffix,
					icon: 'texture',
					click: () => void save(set, p.uuid),
				})),
			],
		}
	})
}

export const LOAD_PERMUTATION_PALETTE_ACTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/load-permutation-palette',
	create() {
		return new Blockbench.Action('animated_java:action/load-permutation-palette', {
			name: translate('palette_panel.load.name'),
			description: translate('palette_panel.load.description'),
			icon: 'input',
			category: 'color',
			condition: () => isEnabled() && getPaletteSets().length > 0,
			click: (event?: Event) => openMenu(event, loadMenuItems()),
			children: loadMenuItems,
		})
	},
})

export const SAVE_PERMUTATION_PALETTE_ACTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/save-permutation-palette',
	create() {
		return new Blockbench.Action('animated_java:action/save-permutation-palette', {
			name: translate('palette_panel.save.name'),
			description: translate('palette_panel.save.description'),
			icon: 'save',
			category: 'color',
			condition: () => isEnabled() && getEditableSets().length > 0,
			click: (event?: Event) => openMenu(event, saveMenuItems()),
			children: saveMenuItems,
		})
	},
})

registerPatch({
	id: 'animated_java:palettes/palette-panel',
	dependencies: [
		'animated_java:action/load-permutation-palette',
		'animated_java:action/save-permutation-palette',
	],

	apply: () => {
		const actions = [
			LOAD_PERMUTATION_PALETTE_ACTION.get()!,
			SAVE_PERMUTATION_PALETTE_ACTION.get()!,
		]
		const toolbar = (Toolbars as Record<string, Toolbar>).palette
		const menu = Panels.palette.menu as Menu
		// After Blockbench's own import and export. Added last-first at one index: each add also
		// restores the others from a saved toolbar layout, and this keeps them in order either way.
		for (const action of [...actions].reverse()) toolbar.add(action, 2)
		for (const action of actions) menu.addAction(action, '#file')
		return { actions, toolbar, menu }
	},

	revert: ({ actions, toolbar, menu }) => {
		for (const action of actions) {
			toolbar.remove(action)
			menu.removeAction(action)
		}
	},
})
