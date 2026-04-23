import { registerProjectPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import { type ItemDisplayMode, VanillaItemDisplay } from '../../outliner/vanillaItemDisplay'
import EVENTS from '../../util/events'
import { localize as translate } from '../../util/lang'
import VanillaItemDisplayElementPanel from './vanillaItemDisplayElement.svelte'

let unmountCallback: (() => Promise<void>) | null = null
let currentUpdatePromise: Promise<void> | null = null

const updatePanel = () => {
	if (currentUpdatePromise) {
		return currentUpdatePromise.then(() => {
			void updatePanel()
		})
	}

	currentUpdatePromise = new Promise(async resolve => {
		await unmountCallback?.()

		const itemDisplay = VanillaItemDisplay.selected.at(0)
		if (itemDisplay) {
			unmountCallback = injectComponent({
				component: VanillaItemDisplayElementPanel,
				props: { selected: itemDisplay },
				elementSelector() {
					return Panels.element.node
				},
				postMount() {
					currentUpdatePromise = null
					resolve()
				},
			})
		} else {
			currentUpdatePromise = null
			resolve()
		}
	})
}

registerProjectPatch({
	id: 'animated_java:append-element-panel/vanilla-item-display',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const unsubscribers = [
			EVENTS.UNDO.subscribe(updatePanel),
			EVENTS.REDO.subscribe(updatePanel),
			EVENTS.UPDATE_SELECTION.subscribe(updatePanel),
		]
		return { unsubscribers }
	},

	revert: async ({ unsubscribers }) => {
		unsubscribers.forEach(u => u())
		await unmountCallback?.()
		unmountCallback = null
	},
})

export const ITEM_DISPLAY_ITEM_DISPLAY_SELECT = new BarSelect(
	`${PACKAGE.name}:itemDisplayAlignmentSelect`,
	{
		name: translate('tool.item_display.item_display.title'),
		icon: 'format_align_left',
		description: translate('tool.item_display.item_display.description'),
		condition: () => activeProjectIsBlueprintFormat() && !!VanillaItemDisplay.selected.length,
		options: {
			none: translate('tool.item_display.item_display.options.none'),
			thirdperson_lefthand: translate(
				'tool.item_display.item_display.options.thirdperson_lefthand'
			),
			thirdperson_righthand: translate(
				'tool.item_display.item_display.options.thirdperson_righthand'
			),
			firstperson_lefthand: translate(
				'tool.item_display.item_display.options.firstperson_lefthand'
			),
			firstperson_righthand: translate(
				'tool.item_display.item_display.options.firstperson_righthand'
			),
			head: translate('tool.item_display.item_display.options.head'),
			gui: translate('tool.item_display.item_display.options.gui'),
			ground: translate('tool.item_display.item_display.options.ground'),
			fixed: translate('tool.item_display.item_display.options.fixed'),
		},
	}
)
ITEM_DISPLAY_ITEM_DISPLAY_SELECT.get = function () {
	const selected = VanillaItemDisplay.selected[0]
	if (!selected) return 'left'
	return selected.itemDisplay
}
ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set = function (this: BarSelect, value: ItemDisplayMode) {
	const selected = VanillaItemDisplay.selected.at(0)
	if (!selected) return this
	this.value = value
	const name = this.getNameFor(value)
	this.nodes.forEach(node => {
		$(node).find('bb-select').text(name)
	})
	if (!this.nodes.includes(this.node)) {
		$(this.node).find('bb-select').text(name)
	}

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
function updateItemDisplaySelect() {
	let value = VanillaItemDisplay.selected.at(0)?.itemDisplay
	value ??= 'none'
	ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set(value)
}
EVENTS.UNDO.subscribe(() => {
	updateItemDisplaySelect()
})
EVENTS.REDO.subscribe(() => {
	updateItemDisplaySelect()
})
