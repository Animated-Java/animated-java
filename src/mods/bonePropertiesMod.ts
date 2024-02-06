import { isCurrentFormat as condition } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { type ContextProperty, createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:boneProperties`,
	{
		configs: undefined as ContextProperty<'instance'>,
	},
	context => {
		context.configs = new Property(Group, 'instance', 'configs', {
			condition,
			default: { default: undefined, variants: {} },
		})
		return context
	},
	context => {
		context.configs?.delete()
	}
)
