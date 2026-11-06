import { registerPatch, registerProjectPatch } from 'blockbench-patch-manager'
import { openPaletteSetDialog } from './dialogs/paletteSet/paletteSet'
import { isEnabledFor, translate } from './host'
import { getPaletteSet, getPaletteSets } from './sets'

const SET_CLASS = 'aj_palette_set'
const EDIT_BUTTON_CLASS = 'aj_palette_set_edit'

/** Like "1 base" or "3 bases". */
function countLabel(count: number, noun: 'base' | 'palette') {
	return translate(`panel.${noun}_${count === 1 ? 'one' : 'other'}`, String(count))
}

function createEditButton(setUuid: string) {
	const button = document.createElement('div')
	button.className = `in_list_button ${EDIT_BUTTON_CLASS}`
	button.title = translate('menu.edit_set')
	button.innerHTML = '<i class="material-icons">tune</i>'
	// The header folds on click and starts dragging on mousedown; the button does neither.
	for (const type of ['mousedown', 'touchstart', 'dblclick'] as const) {
		button.addEventListener(type, event => event.stopPropagation())
	}
	button.addEventListener('click', event => {
		event.stopPropagation()
		const set = getPaletteSet(setUuid)
		if (set) openPaletteSetDialog(set)
	})
	return button
}

/**
 * Marks each set's group in the Textures panel, so CSS can show it as a set: a palette icon, a
 * summary, an edit button, and no import button (the set decides what's in it). Only changes what
 * differs, so it's safe to run after every re-render.
 */
export function decorateSetGroups() {
	const sets = new Map(getPaletteSets().map(set => [set.uuid, set]))
	for (const node of document.querySelectorAll<HTMLElement>('#texture_list li.texture_group')) {
		const set = sets.get(node.id)
		if (node.classList.contains(SET_CLASS) !== !!set) node.classList.toggle(SET_CLASS, !!set)
		const head = node.querySelector<HTMLElement>(':scope > .texture_group_head')
		const label = head?.querySelector<HTMLElement>(':scope > label')
		const button = head?.querySelector<HTMLElement>(`:scope > .${EDIT_BUTTON_CLASS}`)
		if (!head || !label) continue
		if (!set) {
			if (label.dataset.summary !== undefined) delete label.dataset.summary
			button?.remove()
			continue
		}
		const { bases, permutations } = set.palette_set
		const summary = translate(
			'panel.summary',
			countLabel(bases.length, 'base'),
			countLabel(permutations.length, 'palette')
		)
		if (label.dataset.summary !== summary) label.dataset.summary = summary
		if (!button) head.append(createEditButton(set.uuid))
	}
}

registerPatch({
	id: 'animated_java:palettes/panel-style',

	apply: () => {
		const style = Blockbench.addCSS(`
			#texture_list li.${SET_CLASS} > .texture_group_head > label::before {
				content: 'palette';
				font-family: 'Material Icons';
				font-feature-settings: 'liga';
				font-size: 18px;
				vertical-align: middle;
				margin-right: 4px;
				color: var(--color-accent);
			}
			#texture_list li.${SET_CLASS} > .texture_group_head > label::after {
				content: attr(data-summary);
				margin-left: 8px;
				font-size: 0.85em;
				color: var(--color-subtle_text);
			}
			#texture_list li.${SET_CLASS} > .texture_group_head.folded > label::after {
				display: none;
			}
			#texture_list li.${SET_CLASS} > .texture_group_head > .in_list_button:not(.${EDIT_BUTTON_CLASS}) {
				display: none;
			}
		`)
		return { style }
	},

	revert: ({ style }) => {
		style.delete()
	},
})

// Blockbench re-renders group headers as the panel changes, so re-apply the decoration after any
// change to the texture list.
registerProjectPatch({
	id: 'animated_java:palettes/panel-decoration',

	condition: ({ project }) => isEnabledFor(project),

	apply() {
		let queued = false
		const observer = new MutationObserver(() => {
			if (queued) return
			queued = true
			requestAnimationFrame(() => {
				queued = false
				decorateSetGroups()
			})
		})
		const observe = () => {
			const list = document.getElementById('texture_list')
			if (list) observer.observe(list, { childList: true, subtree: true })
			else requestAnimationFrame(observe)
		}
		observe()
		requestAnimationFrame(decorateSetGroups)
		return { observer }
	},

	revert({ observer }) {
		observer.disconnect()
		for (const button of document.querySelectorAll(`.${EDIT_BUTTON_CLASS}`)) button.remove()
	},
})
