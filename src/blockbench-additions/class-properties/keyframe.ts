import { PACKAGE } from '../../constants'
import { type ContextProperty, createBlockbenchMod } from '../../util/moddingTools'
import { isCurrentFormat } from '../model-formats/ajblueprint'

import { EASING_DEFAULT } from '../../util/easing'

createBlockbenchMod(
	`${PACKAGE.name}:additions/class-properties/keyframe`,
	{
		easingProperty: undefined as ContextProperty<'string'>,
		easingArgsProperty: undefined as ContextProperty<'array'>,
	},
	context => {
		context.easingProperty = new Property(Blockbench.Keyframe, 'string', 'easing', {
			default: EASING_DEFAULT,
			condition: () => isCurrentFormat(),
		})
		context.easingArgsProperty = new Property(Blockbench.Keyframe, 'array', 'easingArgs', {
			condition: () => isCurrentFormat(),
		})

		return context
	},
	context => {
		context.easingProperty?.delete()
		context.easingArgsProperty?.delete()
	}
)
