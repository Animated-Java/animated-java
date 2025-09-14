import { createBlockbenchMod } from '@aj/util/moddingTools'

declare global {
	interface ModelFormat {
		isCurrentFormat: () => boolean
	}
}

createBlockbenchMod({
	id: 'animated-java:model-format/is-current-format',
	apply: () => {
		ModelFormat.prototype.isCurrentFormat = function (this) {
			return this === Format
		}
	},
	revert: () => {
		// @ts-expect-error
		delete ModelFormat.prototype.isCurrentFormat
	},
})
