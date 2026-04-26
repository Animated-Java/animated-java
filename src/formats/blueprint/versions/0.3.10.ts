export default function upgrade(model: any) {
	console.log('Processing model for AJ 0.3.10', model)
	const fixed = JSON.parse(JSON.stringify(model))

	fixed.meta ??= {}
	fixed.meta.model_format = 'animated_java/blueprint'

	return fixed
}
