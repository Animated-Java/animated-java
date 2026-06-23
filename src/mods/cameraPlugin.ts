import { registerPluginPatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { sanitizeOutlinerElementName } from '../outliner/util'

registerPluginPatch({
	id: `animated_java:camera-plugin/camera-name-sanitization`,

	condition: plugin => plugin.id === 'cameras',

	apply: () => {
		const camera = OutlinerElement.types.camera

		const originalRename = camera.prototype.saveName
		camera.prototype.saveName = function (this: OutlinerElement, save?: boolean) {
			if (activeProjectIsBlueprintFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return originalRename.call(this, save)
		}

		const originalSanitize = camera.prototype.sanitizeName
		camera.prototype.sanitizeName = function (this: OutlinerElement) {
			if (activeProjectIsBlueprintFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return originalSanitize.call(this)
		}

		// @ts-expect-error
		const cameraAnimator = OutlinerElement.types.camera.animator as BoneAnimator
		const originalDisplayRotation = cameraAnimator.prototype.displayRotation
		cameraAnimator.prototype.displayRotation = function (
			this: BoneAnimator,
			arr?: ArrayVector3 | ArrayVector4,
			multiplier?: number
		) {
			originalDisplayRotation.call(this, arr, multiplier)
			if (activeProjectIsBlueprintFormat()) {
				console.log('Sanitizing camera rotation for blueprint format')
				const mesh = this.getElement().mesh as THREE.Mesh
				// Cameras in AJ don't support roll.
				mesh.updateMatrixWorld(true)
				mesh.getWorldQuaternion(Reusable.quat1)

				const euler = Reusable.euler1.setFromQuaternion(Reusable.quat1, 'YXZ')
				euler.z = 0 // Remove roll

				const noRollWorldQuat = Reusable.quat1.setFromEuler(euler)

				if (mesh.parent) {
					const parentWorldQuat = Reusable.quat2
					mesh.parent.getWorldQuaternion(parentWorldQuat)
					noRollWorldQuat.premultiply(parentWorldQuat.invert())
				}

				mesh.setRotationFromQuaternion(noRollWorldQuat)
				mesh.updateMatrix()
			}
		}

		return { camera, originalRename, originalSanitize, cameraAnimator, originalDisplayRotation }
	},

	revert: ({
		camera,
		originalRename,
		originalSanitize,
		cameraAnimator,
		originalDisplayRotation,
	}) => {
		camera.prototype.rename = originalRename
		camera.prototype.sanitizeName = originalSanitize
		cameraAnimator.prototype.displayRotation = originalDisplayRotation
	},
})
