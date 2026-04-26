import { registerPatch } from 'blockbench-patch-manager'
import {
	activeProjectIsBlueprintFormat as condition,
	type IBlueprintLocatorConfigJSON,
} from '../formats/blueprint'

declare global {
	interface Locator {
		config: IBlueprintLocatorConfigJSON
	}
}

registerPatch({
	id: `animated_java:locator-properties`,

	apply: () => {
		const config = new Property(Locator, 'instance', 'config', {
			condition,
			default: undefined,
		})

		return { config }
	},

	revert: ({ config }) => {
		config?.delete()
	},
})
