import TransparentTexture from '../../../assets/transparent.png'

export default function upgrade(model: any) {
	console.log('Processing model format 1.6.3', model)
	const fixed = JSON.parse(JSON.stringify(model))

	// Automatically add a transparent texture to the model if it uses the old transparent texture in any of it's variants.
	for (const variant of fixed.variants.list) {
		if (Object.values(variant.texture_map).includes('797174ae-5c58-4a83-a630-eefd51007c80')) {
			const texture = new Texture(
				{ name: 'transparent' },
				'797174ae-5c58-4a83-a630-eefd51007c80'
			).fromDataURL(TransparentTexture)
			fixed.textures.push(texture.getSaveCopy())
			break
		}
	}

	return fixed
}
