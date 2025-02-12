import { PACKAGE } from '../../constants'
import { type ContextProperty, createBlockbenchMod } from '../../util/moddingTools'
import { isCurrentFormat as condition } from '../model-formats/ajblueprint'

createBlockbenchMod(
	`${PACKAGE.name}:additions/class-properties/locator`,
	{
		config: undefined as ContextProperty<'instance'>,
	},
	context => {
		context.config = new Property(Locator, 'instance', 'config', {
			condition,
			default: undefined,
		})
		return context
	},
	context => {
		context.config?.delete()
	}
)
