import type { DfuProcessor } from '../dataFixerUpper'

export namespace v2_0_0 {
	export interface AnimatedJavaBlueprint {
		meta: {
			format_version: string
			generator: string
		}
	}
}

export default {
	process(model) {
		console.groupCollapsed('Updating ajblueprint to 2.0.0')
		const fixed = JSON.parse(JSON.stringify(model)) as v2_0_0.AnimatedJavaBlueprint

		fixed.meta.format_version = '2.0.0'

		console.groupEnd()
		return fixed
	},
} satisfies DfuProcessor<any, v2_0_0.AnimatedJavaBlueprint>
