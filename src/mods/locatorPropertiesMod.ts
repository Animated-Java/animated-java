import { isCurrentFormat as condition } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { type ContextProperty, createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:locatorProperties`,
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
