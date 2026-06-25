import { registerDeletableHandlerPatch, registerPatch } from 'blockbench-patch-manager'
import { openEntityCountDialog } from '../dialogs/entityCount/entityCount'
import { Interaction } from '../outliner/interaction'
import { TextDisplay } from '../outliner/textDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'

export function getEntityCounts() {
	const groupEntities = Group.all.filter(
		group => group.export && group.children.some(child => child instanceof Cube)
	).length

	const displayEntities = [
		...TextDisplay.all,
		...VanillaBlockDisplay.all,
		...VanillaItemDisplay.all,
	].filter(display => display.export).length

	const locatorEntities = Locator.all.filter(
		locator => locator.export && locator.config?.use_entity
	).length

	const cameraEntities = OutlinerElement.types.camera
		? // @ts-expect-error - Camera class isn't typed as a class.
			OutlinerElement.types.camera.all.length
		: 0

	const interactionEntities = Interaction.all.filter(interaction => interaction.export).length

	const totalEntities =
		1 + groupEntities + displayEntities + locatorEntities + cameraEntities + interactionEntities

	return {
		groupEntities,
		displayEntities,
		locatorEntities,
		cameraEntities,
		interactionEntities,
		totalEntities,
	}
}

registerDeletableHandlerPatch({
	id: `animated_java:toolbar/entity_counter`,
	create() {
		const widget = new BarText(`animated_java:toolbar/entity_counter`, {
			text: `E: 0`,
			onUpdate() {
				widget.set(`E: ${getEntityCounts().totalEntities}`)
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
