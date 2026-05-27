import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'

registerPropertyOverridePatch({
	id: `animated_java:animator/show-default-pose`,
	target: Animator,
	key: 'showDefaultPose',

	condition: () => activeProjectIsBlueprintFormat(),

	get: () => {
		return function (noMatrixUpdate?: boolean) {
			const nodes = [...Group.all, ...Outliner.elements]
			for (const node of nodes) {
				// @ts-expect-error Constructor type is Function
				if (!node.constructor.animator) continue
				const mesh = node.mesh
				if (mesh.fix_rotation) mesh.rotation.copy(mesh.fix_rotation as THREE.Euler)
				if (mesh.fix_position) mesh.position.copy(mesh.fix_position as THREE.Vector3)
				if (mesh.fix_scale) mesh.scale.copy(mesh.fix_scale)
				else if (
					// @ts-expect-error Constructor type is Function
					node.constructor.animator.prototype.channels?.scale
				) {
					mesh.scale.x = mesh.scale.y = mesh.scale.z = 1
				}
			}
			if (!noMatrixUpdate) Canvas.scene.updateMatrixWorld()
		}
	},
})
