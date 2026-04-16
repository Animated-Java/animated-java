export default function upgrade(model: any) {
	console.log('Processing model format 1.0.0-pre8', model)
	const fixed = JSON.parse(JSON.stringify(model))

	if (fixed.project_settings) {
		fixed.blueprint_settings = fixed.project_settings
		delete fixed.project_settings
	}

	return fixed
}
