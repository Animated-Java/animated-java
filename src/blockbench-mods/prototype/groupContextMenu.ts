import { PACKAGE } from '../../constants'
import { BONE_CONFIG_ACTION } from '../../ui/dialogs/bone-config'
import { createBlockbenchMod } from '../../util/moddingTools'

/**
 * Adds the bone config action to the group context menu
 */
createBlockbenchMod(
	`${PACKAGE.name}:mods/prototype/groupContextMenu`,
	{
		menuStructure: Group.prototype.menu!.structure,
	},
	context => {
		const structure = [...context.menuStructure]
		structure.splice(6, 0, BONE_CONFIG_ACTION)
		Group.prototype.menu!.structure = structure

		return context
	},
	context => {
		Group.prototype.menu!.structure = context.menuStructure
	}
)
