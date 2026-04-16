export default function upgrade(model: any) {
	console.log('Processing model format 1.0.0-pre6', model)
	const fixed = JSON.parse(JSON.stringify(model))

	const defaultVariant = fixed.variants.default
	if (defaultVariant?.excluded_bones) {
		defaultVariant.excluded_nodes = defaultVariant.excluded_bones
		delete defaultVariant.excluded_bones
	}

	for (const variant of fixed.variants?.list ?? []) {
		if (variant?.excluded_bones) {
			variant.excluded_nodes = variant.excluded_bones
			delete variant.excluded_bones
		}
	}

	for (const animation of fixed.animations ?? []) {
		if (animation?.excluded_bones) {
			animation.excluded_nodes = animation.excluded_bones
			delete animation.excluded_bones
		}
	}

	return fixed
}
