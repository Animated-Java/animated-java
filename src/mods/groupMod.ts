import {
	activeProjectIsBlueprintFormat,
	type IBlueprintDisplayEntityConfigJSON,
} from '../formats/blueprint'
import { DisplayEntityConfig } from '../nodeConfigs'
import { sanitizeOutlinerElementName } from '../outliner/util'
import { registerConditionalPropertyOverrideMod, registerMod } from '../util/moddingTools'
import { DeepClonedObjectProperty } from '../util/property'

declare global {
	interface Group {
		onSummonFunction: string
		configs: {
			default: IBlueprintDisplayEntityConfigJSON
			/**
			 * @key Variant UUID
			 * @value Variant Bone Config
			 */
			variants: Record<string, IBlueprintDisplayEntityConfigJSON>
		}
	}
}

// region Properties
registerMod({
	id: `animated-java:bone-properties`,

	apply: () => {
		const properties = [
			new Property(Group, 'string', 'onSummonFunction', {
				condition: activeProjectIsBlueprintFormat,
				default: '',
			}),
			new DeepClonedObjectProperty(Group, 'configs', {
				condition: activeProjectIsBlueprintFormat,
				default: () => {
					return { default: new DisplayEntityConfig().toJSON(), variants: {} }
				},
			}),
		]

		return { properties }
	},

	revert: ({ properties }) => {
		properties.forEach(prop => prop.delete())
	},
})

//region Save Name
registerConditionalPropertyOverrideMod({
	id: `animated-java:override-function/group/save-name`,
	object: Group.prototype,
	key: 'saveName',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: Group, save?: boolean) {
			this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			return original.call(this, save)
		}
	},
})

//region Sanitize Name
registerConditionalPropertyOverrideMod({
	id: `animated-java:override-function/group/sanitize-name`,
	object: Group.prototype,
	key: 'sanitizeName',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: Group) {
			this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			return original.call(this)
		}
	},
})
