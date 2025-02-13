import { PACKAGE } from '../../constants'
import { type ContextProperty, createBlockbenchMod } from '../../util/moddingTools'
import { translate } from '../../util/translation'
import { isCurrentFormat } from '../model-formats/ajblueprint'

createBlockbenchMod(
	`${PACKAGE.name}:additions/class-properties/animation`,
	{
		excludedNodesProperty: undefined as ContextProperty<'array'>,
	},
	context => {
		context.excludedNodesProperty = new Property(
			Blockbench.Animation,
			'array',
			'excluded_nodes',
			{
				condition: () => isCurrentFormat(),
				label: translate('animation.excluded_nodes'),
				default: [],
			}
		)
		return context
	},
	context => {
		context.excludedNodesProperty?.delete()
	}
)
