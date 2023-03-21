import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'
// Cube.all[0].mesh.material = Canvas.wireframeMaterial

createBlockbenchMod(
	'animated_java:animation/affected_bones',
	{
		displayFrame: BoneAnimator.prototype.displayFrame,
	},
	context => {
		BoneAnimator.prototype.displayFrame = function (this: BoneAnimator, multiplier: number) {
			// if (Format === ajModelFormat) {
			// 	const includes = this.animation.affected_bones.find(v => v.value === this.uuid)
			// 	if (
			// 		(!includes && this.animation.affected_bones_is_a_whitelist) ||
			// 		(includes && !this.animation.affected_bones_is_a_whitelist)
			// 	) {
			// 		const bone = this.getGroup()
			// 		if (bone) {
			// 			// console.log(this.uuid, 'not included')
			// 			bone.children.forEach(function recurse(child) {
			// 				if (child instanceof Group) child.children.forEach(recurse)
			// 				else if (child instanceof Cube)
			// 					child.mesh.material = Canvas.wireframeMaterial
			// 			})
			// 		}
			// 		return
			// 	}
			// }
			return context.displayFrame.call(this, multiplier)
		}

		return context
	},
	context => {
		BoneAnimator.prototype.displayFrame = context.displayFrame
	}
)
