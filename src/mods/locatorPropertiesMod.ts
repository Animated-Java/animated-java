import { activeProjectIsBlueprintFormat as condition } from '../blueprintFormat'
import { registerMod } from '../util/moddingTools'

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
