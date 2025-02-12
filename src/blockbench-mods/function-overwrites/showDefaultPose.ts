import { isCurrentFormat } from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

/**
 * Corrects the handling of fix_position, fix_rotation, and fix_scale in the showDefaultPose method.
 */
createBlockbenchMod(
	`${PACKAGE.name}:mods/function-overwrites/showDefaultPose`,
	{
		original: Animator.showDefaultPose,
	},
	context => {
		Animator.showDefaultPose = function (noMatrixUpdate?: boolean) {
			if (!isCurrentFormat()) return context.original(noMatrixUpdate)

			const nodes = [...Group.all, ...Outliner.elements]
			for (const node of nodes) {
				// @ts-expect-error
				if (!node.constructor.animator) continue
				const mesh = node.mesh
				if (mesh.fix_rotation) mesh.rotation.copy(mesh.fix_rotation as THREE.Euler)
				if (mesh.fix_position) mesh.position.copy(mesh.fix_position as THREE.Vector3)
				if (mesh.fix_scale) mesh.scale.copy(mesh.fix_scale)
				else if (
					// @ts-expect-error
					node.constructor.animator.prototype.channels?.scale
				) {
					mesh.scale.x = mesh.scale.y = mesh.scale.z = 1
				}
			}
			if (!noMatrixUpdate) scene.updateMatrixWorld()
		}

		return context
	},
	context => {
		Animator.showDefaultPose = context.original
	}
)
