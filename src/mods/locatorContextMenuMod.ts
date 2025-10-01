import { LOCATOR_CONFIG_ACTION } from '../interface/dialog/locatorConfig'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:locator-context-menu`,

	apply: () => {
		const menuStructure = Locator.prototype.menu!.structure

		const structure = [...menuStructure]
		structure.splice(6, 0, LOCATOR_CONFIG_ACTION)
		Locator.prototype.menu!.structure = structure

		return { menuStructure }
	},

	revert: ({ menuStructure }) => {
		Locator.prototype.menu!.structure = menuStructure
	},
})
