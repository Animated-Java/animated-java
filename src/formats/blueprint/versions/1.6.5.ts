export default function upgrade(model: any) {
	console.log('Processing model format 1.6.5', model)
	const fixed = JSON.parse(JSON.stringify(model))

	// Update target_minecraft_version to an array if it's a string
	if (typeof fixed.blueprint_settings?.target_minecraft_version === 'string') {
		fixed.blueprint_settings.target_minecraft_versions = [
			fixed.blueprint_settings.target_minecraft_version,
		]
		delete fixed.blueprint_settings.target_minecraft_version
	}

	return fixed
}
