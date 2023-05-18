import { LOCATOR_CONFIG_ACTION } from '../ui/ajLocatorConfig'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:locator/force_valid_function_name',
	{
		menuStructure: Locator.prototype.menu!.structure,
		entity_type: undefined as Property<'string'> | undefined,
		nbt: undefined as Property<'string'> | undefined,
	},
	context => {
		const structure = [...context.menuStructure]
		structure.splice(1, 0, LOCATOR_CONFIG_ACTION)
		Locator.prototype.menu!.structure = structure

		context.entity_type = new Property(Locator, 'string', 'entity_type', {
			default: 'minecraft:pig',
		})
		context.nbt = new Property(Locator, 'string', 'nbt', {
			default: '{}',
		})

		return context
	},
	context => {
		context.entity_type?.delete()
		context.nbt?.delete()
		Locator.prototype.menu!.structure = context.menuStructure
	}
)
