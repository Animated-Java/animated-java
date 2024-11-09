import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod, createPropertySubscribable } from '../util/moddingTools'

const ERROR_OUTLINE_MATERIAL = Canvas.outlineMaterial.clone()
ERROR_OUTLINE_MATERIAL.color.set('#ff0000')

function isCubeValid(cube: Cube) {
	// Cube is automatically valid if it has no rotation
	if (cube.rotation[0] === 0 && cube.rotation[1] === 0 && cube.rotation[2] === 0) {
		return true
	}
	const rotation = cube.rotation[0] + cube.rotation[1] + cube.rotation[2]
	// prettier-ignore
	if (
		// Make sure the cube is rotated in only one axis by adding all the rotations together, and checking if the sum is equal to one of the rotations.
		(
			rotation === cube.rotation[0] ||
			rotation === cube.rotation[1] ||
			rotation === cube.rotation[2]
		)
		&&
		// Make sure the cube is rotated in one of the allowed 22.5 degree increments
		(
			rotation === -45   ||
			rotation === -22.5 ||
			rotation === 0     ||
			rotation === 22.5  ||
			rotation === 45
		)
	) {
		return true
	}
	return false
}

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
