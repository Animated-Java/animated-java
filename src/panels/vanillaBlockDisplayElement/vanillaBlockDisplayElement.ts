import { registerProjectPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import { VanillaBlockDisplay } from '../../outliner/vanillaBlockDisplay'
import EVENTS from '../../util/events'
import VanillaBlockDisplayElementPanel from './vanillaBlockDisplayElement.svelte'

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

		const blockDisplay = VanillaBlockDisplay.selected.at(0)
		if (blockDisplay) {
			unmountCallback = injectComponent({
				component: VanillaBlockDisplayElementPanel,
				props: { selected: blockDisplay },
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
	id: 'animated_java:append-element-panel/vanilla-block-display',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const unsubscribers = [
			EVENTS.UNDO.subscribe(updatePanel),
			EVENTS.REDO.subscribe(updatePanel),
			EVENTS.UPDATE_SELECTION.subscribe(updatePanel),
		]
		return { unsubscribers }
	},

	revert: ({ unsubscribers }) => {
		unsubscribers.forEach(u => u())
	},
})
