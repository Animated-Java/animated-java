import { LOCATOR_CONFIG_ACTION } from '../ui/ajLocatorConfig'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:locator/force_valid_function_name',
	{
		menuStructure: Locator.prototype.menu!.structure,
		teleported_entity_type: undefined as Property<'string'> | undefined,
	},
	context => {
		const structure = [...context.menuStructure]
		structure.splice(1, 0, LOCATOR_CONFIG_ACTION)
		Locator.prototype.menu!.structure = structure

		context.teleported_entity_type = new Property(Locator, 'string', 'teleported_entity_type', {
			default: '',
		})

		return context
	},
	context => {
		context.teleported_entity_type?.delete()
		Locator.prototype.menu!.structure = context.menuStructure
	}
)
