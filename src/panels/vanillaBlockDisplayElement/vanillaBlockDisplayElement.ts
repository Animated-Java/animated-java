import { registerProjectPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import VanillaBlockDisplayElementPanel from './vanillaBlockDisplayElement.svelte'

registerProjectPatch({
	id: 'animated_java:append-element-panel/vanilla-block-display',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const unmountCallback = injectComponent({
			component: VanillaBlockDisplayElementPanel,
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
