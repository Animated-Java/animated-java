import { registerProjectPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import { type ItemDisplayMode, VanillaItemDisplay } from '../../outliner/vanillaItemDisplay'
import EVENTS from '../../util/events'
import { localize } from '../../util/lang'
import VanillaItemDisplayElementPanel from './vanillaItemDisplayElement.svelte'

registerProjectPatch({
	id: 'animated_java:append-element-panel/vanilla-item-display',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const unmountCallback = injectComponent({
			component: VanillaItemDisplayElementPanel,
			elementSelector() {
				return Panels.element.node
			},
		})
		return { unmountCallback }
	},

	revert: async ({ unmountCallback }) => {
		await unmountCallback?.()
	},
})

export const ITEM_DISPLAY_ITEM_DISPLAY_SELECT = new BarSelect(
	`${PACKAGE.name}:itemDisplayAlignmentSelect`,
	{
		name: localize('tool.item_display.item_display.title'),
		icon: 'format_align_left',
		description: localize('tool.item_display.item_display.description'),
		condition: () => activeProjectIsBlueprintFormat() && !!VanillaItemDisplay.selected.length,
		options: {
			none: localize('tool.item_display.item_display.options.none'),
			thirdperson_lefthand: localize(
				'tool.item_display.item_display.options.thirdperson_lefthand'
			),
			thirdperson_righthand: localize(
				'tool.item_display.item_display.options.thirdperson_righthand'
			),
			firstperson_lefthand: localize(
				'tool.item_display.item_display.options.firstperson_lefthand'
			),
			firstperson_righthand: localize(
				'tool.item_display.item_display.options.firstperson_righthand'
			),
			head: localize('tool.item_display.item_display.options.head'),
			gui: localize('tool.item_display.item_display.options.gui'),
			ground: localize('tool.item_display.item_display.options.ground'),
			fixed: localize('tool.item_display.item_display.options.fixed'),
		},
	}
)

const getSelectedItemDisplay = () => {
	const selected = VanillaItemDisplay.selected.at(0)
	return selected?.itemDisplay ?? 'none'
}

const updateNode = (select: BarSelect) => {
	const name = select.getNameFor(select.value)
	for (const node of select.nodes) {
		const element = node.querySelector('.bb-select')
		if (!element) continue
		element.textContent = name
	}
	if (!select.nodes.includes(select.node)) {
		const element = select.node.querySelector('.bb-select')
		if (element) element.textContent = name
	}
}

ITEM_DISPLAY_ITEM_DISPLAY_SELECT.get = function (this: BarSelect) {
	updateNode(this)
	return getSelectedItemDisplay()
}
ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set = function (this: BarSelect, value: ItemDisplayMode) {
	const selected = VanillaItemDisplay.selected.at(0)
	if (!selected) return this
	this.value = value
	updateNode(this)

	if (selected.itemDisplay === value) return this

	Undo.initEdit({ elements: VanillaItemDisplay.selected })
	if (VanillaItemDisplay.selected.length > 1) {
		for (const display of VanillaItemDisplay.selected) {
			display.itemDisplay = value
			void display.updateItem()
		}
	} else {
		selected.itemDisplay = value
		void selected.updateItem()
	}
	Project!.saved = false
	Undo.finishEdit(`Change Item Display Node's Item Display Mode to ${value}`, {
		elements: VanillaItemDisplay.selected,
	})
	return this
}
export function updateItemDisplaySelect() {
	ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set(getSelectedItemDisplay())
}
EVENTS.UNDO.subscribe(() => {
	updateItemDisplaySelect()
})
EVENTS.REDO.subscribe(() => {
	updateItemDisplaySelect()
})
