import { PACKAGE } from '../constants'
import { getItemModel } from '../systems/minecraft/itemModelManager'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:groupExtendMod`,
	{
		originalExtend: Group.prototype.extend,
		originalDuplicate: Group.prototype.duplicate,
	},
	context => {
		Group.prototype.extend = function (this: Group, options) {
			const result = context.originalExtend.call(this, options)
			for (const child of result.children) {
				if (child instanceof Cube) {
					child.export = false
					child.visibility = false
				}
				Canvas.updateAll()
			}

			if (result.configs.default?.vanilla_item_model) {
				void getItemModel(result.configs.default.vanilla_item_model).then(mesh => {
					if (mesh) {
						result.mesh.add(mesh)
					}
				})
			}
			return result
		}

		Group.prototype.duplicate = function (this: Group) {
			const result = context.originalDuplicate.call(this)

			if (result.configs.default?.vanilla_item_model) {
				void getItemModel(result.configs.default.vanilla_item_model).then(mesh => {
					if (mesh) {
						result.mesh.add(mesh)
					}
				})
			}
			return result
		}
		return context
	},
	context => {
		Group.prototype.extend = context.originalExtend
		Group.prototype.duplicate = context.originalDuplicate
	}
)
