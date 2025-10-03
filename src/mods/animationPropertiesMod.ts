import { registerMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'
import { roundToNth } from '../util/misc'
import { translate } from '../util/translation'

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		excluded_nodes: CollectionItem[]
	}

	interface AnimationUndoCopy {
		excluded_nodes: string[]
	}

	interface AnimationOptions {
		excluded_nodes: string[]
	}
}

export const DEFAULT_SNAPPING_VALUE = 20
export const MINIMUM_ANIMATION_LENGTH = 0.05

registerMod({
	id: `animated-java:animation-properties-mod`,

	apply: () => {
		const originalExtend = Blockbench.Animation.prototype.extend
		Blockbench.Animation.prototype.extend = function (
			this: _Animation,
			data: AnimationOptions
		) {
			originalExtend.call(this, data)
			if (activeProjectIsBlueprintFormat()) {
				this.snapping = DEFAULT_SNAPPING_VALUE
				this.length = Math.max(this.length, MINIMUM_ANIMATION_LENGTH)
				for (const animator of Object.values(this.animators)) {
					if (!animator) continue
					let lastTime = -Infinity
					for (const kf of animator.keyframes) {
						let rounded = roundToNth(kf.time, DEFAULT_SNAPPING_VALUE)
						if (rounded === kf.time) continue
						if (rounded === lastTime) rounded += 0.05
						kf.time = rounded
						lastTime = rounded
					}
				}
			}
			return this
		}

		const originalSetLength = Blockbench.Animation.prototype.setLength
		Blockbench.Animation.prototype.setLength = function (this: _Animation, length?: number) {
			if (activeProjectIsBlueprintFormat()) {
				length = Math.max(length || this.length, MINIMUM_ANIMATION_LENGTH)
			}
			return originalSetLength.call(this, length)
		}

		const excludedNodesProperty = new Property(
			Blockbench.Animation,
			'array',
			'excluded_nodes',
			{
				condition: () => activeProjectIsBlueprintFormat(),
				label: translate('animation.excluded_nodes'),
				default: [],
			}
		)

		return { originalExtend, originalSetLength, excludedNodesProperty }
	},

	revert: ({ originalExtend, originalSetLength, excludedNodesProperty }) => {
		Blockbench.Animation.prototype.extend = originalExtend
		Blockbench.Animation.prototype.setLength = originalSetLength
		excludedNodesProperty.delete()
	},
})
