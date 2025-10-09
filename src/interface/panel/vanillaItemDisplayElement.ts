import VanillaItemDisplayElementPanel from '../../components/vanillaItemDisplayElementPanel.svelte'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint/format'
import { type ItemDisplayMode, VanillaItemDisplay } from '../../outliner/vanillaItemDisplay'
import EVENTS from '../../util/events'
import { injectSvelteComponentMod } from '../../util/injectSvelteComponent'
import { translate } from '../../util/translation'

injectSvelteComponentMod({
	component: VanillaItemDisplayElementPanel,
	props: {},
	elementSelector() {
		return document.querySelector('#panel_element')
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
ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set = function (
	this: BarSelect<ItemDisplayMode>,
	value: ItemDisplayMode
) {
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
		}
	} else {
		selected.itemDisplay = value
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
