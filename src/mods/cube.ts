import {
	overrideAccessors,
	registerPatch,
	registerPropertyOverridePatch,
} from 'blockbench-patch-manager'
import {
	activeProjectIsBlueprintFormat,
	projectTargetVersionIsAtLeast,
	type IBlueprintDisplayEntityConfigJSON,
} from '../formats/blueprint'
import {
	applyEnchantmentGlintToMesh,
	removeEnchantmentGlintFromMesh,
} from '../shaders/enchantmentGlint'
import { isCubeValid } from '../systems/util'
import { localize as translate } from '../util/lang'
import { Variant } from '../variants'

declare global {
	// @ts-expect-error - Broken BB types
	interface Cube {
		isRotationValid: boolean
	}
}

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
				projectTargetVersionIsAtLeast('1.21.6')
					? 'toast.invalid_rotations_post_1_21_6'
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

registerPatch({
	id: `animated_java:cube-outline-mod`,

	apply: () => {
		const originalUpdateTransform = Cube.preview_controller.updateTransform
		Cube.preview_controller.updateTransform = function (cube: Cube) {
			if (activeProjectIsBlueprintFormat()) {
				const validity = isCubeValid(cube)

				switch (validity) {
					case 'valid': {
						updateCubeValidity(cube, true)
						break
					}
					case '1.21.6+': {
						if (projectTargetVersionIsAtLeast('1.21.6')) {
							updateCubeValidity(cube, true)
							break
						}
						// Fallthrough to invalid if the target version is below 1.21.6
					}
					case 'invalid': {
						updateCubeValidity(cube, false)
						showToastNotification()
						break
					}
				}
			}
			originalUpdateTransform.call(this, cube)
		}

		const originalInit = Cube.prototype.init
		Cube.prototype.init = function (this: Cube) {
			const cube = originalInit.call(this)

			cube.isRotationValid = true

			overrideAccessors({
				target: cube.mesh.outline,
				key: 'visible',
				set: value => {
					if (!activeProjectIsBlueprintFormat()) return value
					return !cube.isRotationValid || value
				},
			})

			return cube
		}

		return { originalUpdateTransform, originalInit }
	},

	revert: ({ originalUpdateTransform, originalInit }) => {
		Cube.preview_controller.updateTransform = originalUpdateTransform
		Cube.prototype.init = originalInit
	},
})

registerPropertyOverridePatch({
	id: `animated_java:override-function/cube/preview_controller/updateGeometry`,
	target: Cube.preview_controller,
	key: 'updateGeometry',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: NodePreviewController, instance: Cube) {
			original.apply(this, [instance])

			if (activeProjectIsBlueprintFormat()) {
				const parent = instance.parent
				let config: IBlueprintDisplayEntityConfigJSON
				if (parent instanceof Group) {
					if (!Variant.selected || Variant.selected.isDefault) {
						config = parent.configs.default
					} else {
						config = parent.configs.variants[Variant.selected.uuid]
					}

					removeEnchantmentGlintFromMesh(instance.mesh)

					if (config?.enchanted) {
						applyEnchantmentGlintToMesh(instance.mesh)
					}
				}
			}
		}
	},
})
