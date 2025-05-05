import { PACKAGE } from '../../constants'
import { LOCATOR_CONFIG_ACTION } from '../../ui/dialogs/locator-config'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:mods/prototype/locatorContextMenu`,
	{
		menuStructure: Locator.prototype.menu!.structure,
	},
	context => {
		const structure = [...context.menuStructure]
		structure.splice(6, 0, LOCATOR_CONFIG_ACTION)
		Locator.prototype.menu!.structure = structure

		return context
	},
	context => {
		Locator.prototype.menu!.structure = context.menuStructure
	}
)
