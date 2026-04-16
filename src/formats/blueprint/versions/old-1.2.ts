export default function upgrade(model: any) {
	console.log('Processing model format 1.2', model)
	const fixed = JSON.parse(JSON.stringify(model))
	for (const variant of fixed.animated_java.variants) {
		for (const [from, to] of Object.entries(variant.textureMap as Record<string, string>)) {
			const fromUUID = from.split('::')[0]
			const toUUID = to.split('::')[0]
			variant.textureMap[fromUUID] = toUUID
			delete variant.textureMap[from]
		}
	}
	return fixed
}
