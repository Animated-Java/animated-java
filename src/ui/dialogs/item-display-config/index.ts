import { isCurrentFormat } from '../../blueprintFormat'
import ItemDisplayElementPanel from '../../svelte/itemDisplayElementPanel.svelte'
import { PACKAGE } from '../../constants'
import { ItemDisplayMode, ItemDisplay } from '../../outliner/itemDisplay'
import { events } from '../../util/events'
import { injectSvelteCompomponentMod } from '../../util/injectSvelteComponent'
import { translate } from '../../util/translation'

injectSvelteCompomponentMod({
	component: ItemDisplayElementPanel,
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
		condition: () => isCurrentFormat() && !!ItemDisplay.selected.length,
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
	const selected = ItemDisplay.selected[0]
	if (!selected) return 'left'
	return selected.itemDisplay
}
ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set = function (
	this: BarSelect<ItemDisplayMode>,
	value: ItemDisplayMode
) {
	const selected = ItemDisplay.selected.at(0)
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

	Undo.initEdit({ elements: ItemDisplay.selected })
	if (ItemDisplay.selected.length > 1) {
		for (const display of ItemDisplay.selected) {
			display.itemDisplay = value
		}
	} else {
		selected.itemDisplay = value
	}
	Project!.saved = false
	Undo.finishEdit(`Change Item Display Node's Item Display Mode to ${value}`, {
		elements: ItemDisplay.selected,
	})
	return this
}
function updateItemDisplaySelect() {
	console.log('updateItemDisplaySelect')
	let value = ItemDisplay.selected.at(0)?.itemDisplay
	value ??= 'none'
	ITEM_DISPLAY_ITEM_DISPLAY_SELECT.set(value)
}
events.UNDO.subscribe(() => {
	updateItemDisplaySelect()
})
events.REDO.subscribe(() => {
	updateItemDisplaySelect()
})
