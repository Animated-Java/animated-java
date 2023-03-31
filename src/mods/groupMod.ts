import { safeFunctionName } from '../minecraft'
import { ajModelFormat } from '../modelFormat'
import { BONE_CONFIG_ACTION } from '../ui/ajBoneConfig'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:group/force_valid_function_name',
	{
		menuStructure: Group.prototype.menu!.structure,
		createUniqueName: Group.prototype.createUniqueName,
		nbtProperty: undefined as Property<'string'> | undefined,
	},
	context => {
		const structure = [...context.menuStructure]
		structure.splice(5, 0, BONE_CONFIG_ACTION)
		Group.prototype.menu!.structure = structure

		context.nbtProperty = new Property(Group, 'string', 'nbt', { default: '{}' })

		Group.prototype.createUniqueName = function (this: Group, others?: Group[]) {
			if (Format === ajModelFormat) {
				this.name = safeFunctionName(this.name)
			}
			return context.createUniqueName.call(this, others)
		}
		return context
	},
	context => {
		context.nbtProperty?.delete()
		Group.prototype.menu!.structure = context.menuStructure
		Group.prototype.createUniqueName = context.createUniqueName
	}
)
