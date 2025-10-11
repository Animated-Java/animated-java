import { sanitizeOutlinerElementName } from 'src/outliner/util'
import { registerConditionalPropertyOverrideMod, registerMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat, type IBlueprintBoneConfigJSON } from '../formats/blueprint'

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

// region Properties
registerMod({
	id: `animated-java:bone-properties`,

	apply: () => {
		const configs = new DeepClonedObjectProperty(Group, 'configs', {
			condition: () => activeProjectIsBlueprintFormat(),
			default: { default: undefined, variants: {} },
		})

		return { configs }
	},

	revert: ({ configs }) => {
		configs.delete()
	},
})

//region Save Name
registerConditionalPropertyOverrideMod({
	id: `animated-java:override-function/group/save-name`,
	object: Group.prototype,
	key: 'saveName',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),
		override: original => {
			return function (this: Group, save?: boolean) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
				return original.call(this, save)
			}
		},
	},
})

//region Sanitize Name
registerConditionalPropertyOverrideMod({
	id: `animated-java:override-function/group/sanitize-name`,
	object: Group.prototype,
	key: 'sanitizeName',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),
		override: original => {
			return function (this: Group) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
				return original.call(this)
			}
		},
	},
})
