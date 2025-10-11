import {
	activeProjectIsBlueprintFormat as condition,
	type IBlueprintLocatorConfigJSON,
} from '../formats/blueprint'
import { registerMod } from '../util/moddingTools'

declare global {
	interface Locator {
		config: IBlueprintLocatorConfigJSON
	}
}

registerMod({
	id: `animated-java:locator-properties`,

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
