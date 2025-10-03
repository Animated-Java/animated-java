import { registerMod } from 'src/util/moddingTools'
import {
	activeProjectIsBlueprintFormat as condition,
	type IBlueprintBoneConfigJSON,
} from '../formats/blueprint/format'

declare global {
	interface Group {
		configs: {
			default: IBlueprintBoneConfigJSON
			/**
			 * @key Variant UUID
			 * @value Variant Bone Config
			 */
			variants: Record<string, IBlueprintBoneConfigJSON>
		}
	}
}

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

registerMod({
	id: `animated-java:bone-properties`,

	apply: () => {
		const configs = new DeepClonedObjectProperty(Group, 'configs', {
			condition,
			default: { default: undefined, variants: {} },
		})

		return { configs }
	},

	revert: ({ configs }) => {
		configs.delete()
	},
})
