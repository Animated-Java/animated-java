import { PACKAGE } from '../constants'
import { BONE_CONFIG_ACTION } from '../interface/boneConfigDialog'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:groupContextMenu`,
	{
		menuStructure: Group.prototype.menu!.structure,
	},
	context => {
		const structure = [...context.menuStructure]
		structure.splice(5, 0, BONE_CONFIG_ACTION)
		Group.prototype.menu!.structure = structure

		return context
	},
	context => {
		Group.prototype.menu!.structure = context.menuStructure
	}
)
