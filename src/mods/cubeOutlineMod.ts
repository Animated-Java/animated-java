import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { isCubeValid } from '../systems/util'
import { createBlockbenchMod, createPropertySubscribable } from '../util/moddingTools'

const ERROR_OUTLINE_MATERIAL = Canvas.outlineMaterial.clone()
ERROR_OUTLINE_MATERIAL.color.set('#ff0000')

createBlockbenchMod(
	`${PACKAGE.name}:cubeOutlineMod`,
	{
		originalUpdateTransform: Cube.preview_controller.updateTransform,
		originalInit: Cube.prototype.init,
	},
	context => {
		Cube.preview_controller.updateTransform = function (cube: Cube) {
			if (isCurrentFormat()) {
				const isValid = isCubeValid(cube)
				if (cube.rotationInvalid && isValid) {
					cube.mesh.outline.material = Canvas.outlineMaterial
					cube.rotationInvalid = false
				} else if (!cube.rotationInvalid && !isValid) {
					cube.mesh.outline.material = ERROR_OUTLINE_MATERIAL
					cube.rotationInvalid = true
					if (!Project!.showingInvalidCubeRotations) {
						Blockbench.showToastNotification({
							text: 'Invalid Cube Rotation!\nCubes can only be rotated in 22.5 degree increments (45, 22.5, 0, -22.5, -45) and can only be rotated on a single axis.\nThe offending cubes have been highlighted in red.',
							color: 'var(--color-error)',
						})
						Project!.showingInvalidCubeRotations = true
					}
				}
			}
			context.originalUpdateTransform.call(this, cube)
		}

		Cube.prototype.init = function (this: Cube) {
			const cube = context.originalInit.call(this)

			cube.rotationInvalid = false

			const [get] = createPropertySubscribable(this.mesh.outline, 'visible')
			get.subscribe(({ storage }) => {
				if (isCurrentFormat()) storage.value = this.rotationInvalid || storage.value
			})

			return cube
		}

		return context
	},
	context => {
		Cube.preview_controller.updateTransform = context.originalUpdateTransform
		Cube.prototype.init = context.originalInit
	}
)
