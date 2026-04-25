import { registerPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { DisplayEntityConfig } from '../nodeConfigs'
import { sanitizeOutlinerElementName } from '../outliner/util'
import type { IDisplayEntityConfigs } from '../systems/rigRenderer'
import { localize } from '../util/lang'
import { DeepClonedObjectProperty } from '../util/property'

declare global {
	// @ts-expect-error - Broken BB types
	interface Group {
		onSummonFunction: string
		configs: IDisplayEntityConfigs
	}
}

registerPropertyOverridePatch({
	id: `animated_java:structure-group-icon`,
	target: Group.prototype,
	key: 'icon',

	get: function (this, original) {
		if (activeProjectIsBlueprintFormat()) {
			if (this.children.some(child => child instanceof Cube)) {
				return original
			}
			return 'account_tree'
		}
		return original
	},
})

registerPropertyOverridePatch({
	id: `animated_java:structure-group-title`,
	target: Group.prototype,
	key: 'title',

	get: function (this, original) {
		if (activeProjectIsBlueprintFormat()) {
			if (this.children.some(child => child instanceof Cube)) {
				return original
			}
			return localize('outliner.structure_group.title')
		}
		return original
	},
})

// region Properties
registerPatch({
	id: `animated_java:bone-properties`,

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
registerPropertyOverridePatch({
	id: `animated_java:override-function/group/save-name`,
	target: Group.prototype,
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
registerPropertyOverridePatch({
	id: `animated_java:override-function/group/sanitize-name`,
	target: Group.prototype,
	key: 'sanitizeName',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: Group) {
			this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			return original.call(this)
		}
	},
})
