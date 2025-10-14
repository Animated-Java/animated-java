import { BLUEPRINT_FORMAT_ID } from 'src/formats/blueprint'
import { VanillaBlockDisplay } from 'src/outliner/vanillaBlockDisplay'
import EVENTS from 'src/util/events'
import { registerProjectMod } from 'src/util/moddingTools'
import { mountSvelteComponent } from 'src/util/mountSvelteComponent'
import VanillaBlockDisplayElementPanel from '../../components/vanillaBlockDisplayElementPanel.svelte'

let mounted: VanillaBlockDisplayElementPanel | null = null

const destroyMounted = () => {
	mounted?.$destroy()
	mounted = null
}

const updatePanel = () => {
	destroyMounted()
	const blockDisplay = VanillaBlockDisplay.selected.at(0)
	if (blockDisplay) {
		mounted = mountSvelteComponent({
			component: VanillaBlockDisplayElementPanel,
			props: { selected: blockDisplay },
			target: '#panel_element',
		})
	}
}

registerProjectMod({
	id: 'animated-java:append-element-panel/vanilla-block-display',

	condition: project => project.format.id === BLUEPRINT_FORMAT_ID,

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
		destroyMounted()
	},
})
