import { registerPatch } from 'blockbench-patch-manager'
import { BLUEPRINT_FORMAT_ID, convertToBlueprint } from '../formats/blueprint'

/**
 * Gives outliner nodes made in another format the properties a Blueprint adds, like a bone's
 * `configs`. Those are only set when a node is created, and only if their condition passes then.
 */
function addMissingNodeProperties() {
	for (const node of [...Group.all, ...Outliner.elements]) {
		const { properties } = node.constructor as typeof OutlinerNode
		for (const property of Object.values(properties)) {
			// `reset` skips properties whose condition fails in the new format.
			if ((node as Record<string, any>)[property.name] === undefined) property.reset(node)
		}
	}
}

registerPatch({
	id: `animated_java:model-format-convert-to-mod`,

	apply: () => {
		const original = ModelFormat.prototype.convertTo

		ModelFormat.prototype.convertTo = function (this: ModelFormat) {
			if (this.id !== BLUEPRINT_FORMAT_ID) return original.call(this)
			// Blockbench redraws the model before convertTo returns, so nodes need their
			// Blueprint properties as soon as the format switches.
			Blockbench.on('select_format', addMissingNodeProperties)
			let result: unknown
			try {
				result = original.call(this)
			} finally {
				Blockbench.removeListener('select_format', addMissingNodeProperties)
			}
			convertToBlueprint()
			return result
		}

		return { original }
	},

	revert: ({ original }) => {
		ModelFormat.prototype.convertTo = original
	},
})
