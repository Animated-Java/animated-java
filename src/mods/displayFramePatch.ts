import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `animated_java:blockbench-fix/bone-animator/display-frame`,
	target: BoneAnimator.prototype,
	key: 'displayFrame',

	get: original => {
		return function (this: BoneAnimator, multiplier?: number) {
			if (!this.doRender()) return
			this.getGroup()
			// @ts-expect-error - Broken BB types
			Animator.MolangParser.context.animation = this.animation

			if (this.channels.rotation && !this.muted.rotation)
				this.displayRotation(this.interpolate('rotation') || undefined, multiplier)
			if (this.channels.position && !this.muted.position)
				this.displayPosition(this.interpolate('position') || undefined, multiplier)
			if (this.channels.scale && !this.muted.scale)
				this.displayScale(this.interpolate('scale') || undefined, multiplier)

			for (const channel in this.channels) {
				const channelConfig = this.channels[channel]
				// @ts-expect-error - Broken BB types
				if (channelConfig.displayFrame && !this.muted[channel]) {
					// @ts-expect-error - Broken BB types
					channelConfig.displayFrame(this, multiplier)
				}
			}
		}
	},
})
