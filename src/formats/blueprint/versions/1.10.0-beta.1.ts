import type { IBlueprintFormatJSON } from '..'

export default function upgrade(model: any): IBlueprintFormatJSON {
	console.log('Processing model format 1.10.0-beta.1', JSON.parse(JSON.stringify(model)))
	const fixed: IBlueprintFormatJSON = JSON.parse(JSON.stringify(model))

	// Invert rotation xy and position x for Blockbench 5.0
	for (const animation of fixed.animations ?? []) {
		for (const [uuid, animator] of Object.entries<Record<string, any>>(
			animation.animators ?? {}
		)) {
			console.log('Processing animator', uuid, JSON.parse(JSON.stringify(animator)))
			for (const keyframe of animator.keyframes ?? []) {
				console.log('Processing keyframe', JSON.parse(JSON.stringify(keyframe)))
				if (keyframe.channel === 'rotation') {
					for (const datapoint of keyframe.data_points ?? []) {
						console.log('Processing datapoint', JSON.parse(JSON.stringify(datapoint)))
						datapoint.x = invertMolang(datapoint.x)
						datapoint.y = invertMolang(datapoint.y)
					}
				}
				if (keyframe.channel === 'position') {
					for (const datapoint of keyframe.data_points ?? []) {
						console.log(
							'Processing position datapoint',
							JSON.parse(JSON.stringify(datapoint))
						)
						datapoint.x = invertMolang(datapoint.x)
					}
				}
			}
		}
	}

	return fixed
}
