import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:boneProperties`,
	{
		originalUpdateHighlight: Group.preview_controller.updateHighlight,
		originalSelect: Group.prototype.select,
		originalUnselect: Group.prototype.unselect,
	},
	context => {
		Group.preview_controller.updateHighlight = function (
			this: NodePreviewController,
			element: Group,
			forced = false
		) {
			if (!isCurrentFormat()) return context.originalUpdateHighlight?.call(this, element)

			const vanillaItemMesh = element.mesh.children.at(0) as THREE.Mesh | undefined
			if (!vanillaItemMesh?.isVanillaItemModel) return
			const highlight = vanillaItemMesh.geometry.attributes.highlight
			const highlighted =
				forced ||
				(Settings.get('highlight_cubes') &&
					element.selected &&
					Modes.selected === Modes.options.edit)
					? 1
					: 0

			if (highlight.array[0] != highlighted) {
				// @ts-ignore
				highlight.array.set(Array(highlight.count).fill(highlighted))
				highlight.needsUpdate = true
			}

			this.dispatchEvent('update_highlight', { element })
		}

		Group.prototype.select = function (this: Group) {
			const result = context.originalSelect.call(this)
			if (!isCurrentFormat()) return result
			Group.preview_controller.updateHighlight(this)
			return result
		}

		Group.prototype.unselect = function (this: Group) {
			const result = context.originalUnselect.call(this)
			if (!isCurrentFormat()) return result
			Group.preview_controller.updateHighlight(this)
			return result
		}

		return context
	},
	context => {
		Group.preview_controller.updateHighlight = context.originalUpdateHighlight
	}
)
