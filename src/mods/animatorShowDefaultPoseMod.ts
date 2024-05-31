import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:animatorShowDefaultPose`,
	{
		originalShowDefaultPose: Animator.showDefaultPose,
	},
	context => {
		Animator.showDefaultPose = function (noMatrixUpdate?: boolean) {
			if (isCurrentFormat()) {
				const elements = [...Group.all, ...Outliner.elements]
				for (const node of elements) {
					// @ts-expect-error
					if (!node.constructor.animator) continue
					const mesh = node.mesh as THREE.Mesh
					if (mesh.fix_rotation) mesh.rotation.copy(mesh.fix_rotation as THREE.Euler)
					if (mesh.fix_position) mesh.position.copy(mesh.fix_position as THREE.Vector3)
					if (
						// @ts-expect-error
						node.constructor.animator.prototype.channels &&
						// @ts-expect-error
						node.constructor.animator.prototype.channels.scale
					) {
						mesh.scale.x = mesh.scale.y = mesh.scale.z = 1
					}
				}
				if (!noMatrixUpdate) scene.updateMatrixWorld()
			} else {
				return context.originalShowDefaultPose(noMatrixUpdate)
			}
		}

		return context
	},
	context => {
		Animator.showDefaultPose = context.originalShowDefaultPose
	}
)
