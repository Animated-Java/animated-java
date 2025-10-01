import { BONE_CONFIG_ACTION } from '../interface/dialog/boneConfig'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:group-context-menu`,

	apply: () => {
		const menuStructure = Group.prototype.menu!.structure

		const originalStructure = [...menuStructure]
		originalStructure.splice(6, 0, BONE_CONFIG_ACTION)
		Group.prototype.menu!.structure = originalStructure

		return { originalStructure }
	},

	revert: ({ originalStructure }) => {
		Group.prototype.menu!.structure = originalStructure
	},
})
