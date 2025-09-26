import { translate } from 'src/util/translation'
import { checkTargetVersionsMeetRequirement, isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { isCubeValid } from '../systems/util'
import { createBlockbenchMod, createPropertySubscribable } from '../util/moddingTools'

const ERROR_OUTLINE_MATERIAL = Canvas.outlineMaterial.clone()
ERROR_OUTLINE_MATERIAL.color.set('#ff0000')

export function updateAllCubeOutlines() {
	for (const cube of Cube.all) {
		Cube.preview_controller.updateTransform(cube)
	}
}

function updateCubeValidity(cube: Cube, isValid: boolean) {
	if (cube.isRotationValid === isValid) return
	cube.mesh.outline.material = isValid ? Canvas.outlineMaterial : ERROR_OUTLINE_MATERIAL
	cube.isRotationValid = isValid
}

let toastNotification: Deletable | null = null

function showToastNotification() {
	if (!toastNotification) {
		toastNotification = Blockbench.showToastNotification({
			text: translate(
				checkTargetVersionsMeetRequirement('1.21.4')
					? 'toast.invalid_rotations_post_1_21_4'
					: 'toast.invalid_rotations'
			),
			color: 'var(--color-error)',
			click: () => false,
		})
		const intervalId = setInterval(() => {
			if (
				Cube.all.some(cube => isCubeValid(cube) === 'invalid') &&
				document.querySelector('li.toast_notification')
			)
				return
			clearInterval(intervalId)
			toastNotification?.delete()
			toastNotification = null
			requestAnimationFrame(updateAllCubeOutlines)
		}, 1000)
	}
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
				const validity = isCubeValid(cube)

				switch (validity) {
					case 'valid': {
						updateCubeValidity(cube, true)
						break
					}
					case '1.21.4+': {
						if (checkTargetVersionsMeetRequirement('1.21.4')) {
							updateCubeValidity(cube, true)
							break
						}
						// Fallthrough to invalid if the target version is below 1.21.4
					}
					case 'invalid': {
						updateCubeValidity(cube, false)
						showToastNotification()
						break
					}
				}
			}
			context.originalUpdateTransform.call(this, cube)
		}

		Cube.prototype.init = function (this: Cube) {
			const cube = context.originalInit.call(this)

			cube.isRotationValid = true

			const [, setVisible] = createPropertySubscribable(cube.mesh.outline, 'visible')
			setVisible.subscribe(({ storage }) => {
				if (!isCurrentFormat()) return
				storage.value = !cube.isRotationValid || storage.value
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
