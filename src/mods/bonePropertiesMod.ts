import { isCurrentFormat as condition } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { type ContextProperty, createBlockbenchMod } from '../util/moddingTools'

class DeepClonedObjectProperty extends Property<'object'> {
	constructor(targetClass: any, name: string, options?: PropertyOptions) {
		super(targetClass, 'object', name, options)
	}
	merge(instance: any, data: any) {
		if (typeof data[this.name] === 'object') {
			instance[this.name] = JSON.parse(JSON.stringify(data[this.name]))
		}
	}
	copy(instance: any, target: any) {
		if (typeof instance[this.name] === 'object') {
			target[this.name] = JSON.parse(JSON.stringify(instance[this.name]))
		}
	}
}

createBlockbenchMod(
	`${PACKAGE.name}:boneProperties`,
	{
		configs: undefined as ContextProperty<'object'>,
	},
	context => {
		context.configs = new DeepClonedObjectProperty(Group, 'configs', {
			condition,
			default: { default: undefined, variants: {} },
		})

		return context
	},
	context => {
		context.configs?.delete()
	}
)
