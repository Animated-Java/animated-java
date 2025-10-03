import { activeProjectIsBlueprintFormat } from '../blueprintFormat'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:show-default-pose`,

	apply: () => {
		const original = Animator.showDefaultPose

		Animator.showDefaultPose = function (noMatrixUpdate?: boolean) {
			if (!activeProjectIsBlueprintFormat()) return original(noMatrixUpdate)

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
					node.constructor.animator.prototype.channels &&
					// @ts-expect-error
					node.constructor.animator.prototype.channels.scale
				) {
					mesh.scale.x = mesh.scale.y = mesh.scale.z = 1
				}
			}
			if (!noMatrixUpdate) scene.updateMatrixWorld()
		}

		return { original }
	},

	revert: ({ original }) => {
		Animator.showDefaultPose = original
	},
})
