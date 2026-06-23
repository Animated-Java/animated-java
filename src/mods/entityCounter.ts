import { registerDeletableHandlerPatch, registerPatch } from 'blockbench-patch-manager'
import { openEntityCountDialog } from '../dialogs/entityCount/entityCount'
import { Interaction } from '../outliner/interaction'
import { TextDisplay } from '../outliner/textDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'

export function getTotalEntityCount() {
	let count = 1 // Start with 1 for the root entity
	for (const node of Outliner.nodes) {
		switch (true) {
			case node instanceof Group:
				if (node.children.some(child => child instanceof Cube)) count++
				break
			case node instanceof TextDisplay:
			case node instanceof VanillaBlockDisplay:
			case node instanceof VanillaItemDisplay:
			case node instanceof Interaction:
			case node.type === 'camera':
				count++
		}
	}
	return count
}

registerDeletableHandlerPatch({
	id: `animated_java:toolbar/entity_counter`,
	create() {
		const widget = new BarText(`animated_java:toolbar/entity_counter`, {
			text: `E: 0`,
			onUpdate() {
				widget.set(`E: ${getTotalEntityCount()}`)
			},
			click: openEntityCountDialog,
		})
		Toolbars.outliner.add(widget) // Add the widget to the outliner toolbar
		return widget
	},
})

registerPatch({
	id: `animated_java:toolbar/entity_counter/updateEvent`,
	apply() {
		const triggerUpdate = () => {
			;(BarItems[`animated_java:toolbar/entity_counter`] as BarText).onUpdate()
		}
		Blockbench.on('update_selection', triggerUpdate)
		return { triggerUpdate }
	},
	revert({ triggerUpdate }) {
		Blockbench.removeListener('update_selection', triggerUpdate)
	},
})
