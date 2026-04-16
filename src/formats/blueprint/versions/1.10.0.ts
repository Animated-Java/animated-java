import type { IBlueprintFormatJSON } from '..'

export default function upgrade(model: any): IBlueprintFormatJSON {
	console.log('Processing model format 1.10.0', JSON.parse(JSON.stringify(model)))
	const fixed: IBlueprintFormatJSON = JSON.parse(JSON.stringify(model))

	// TODO - Fix 5.0's inverted rotations

	return fixed
}
