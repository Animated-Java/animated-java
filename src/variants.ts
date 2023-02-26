import { ajModelFormat } from './modelFormat'
import { Subscribable } from './util/suscribable'

export class Variant {
	textures: Record<string, string>
	constructor(public name: string, textures?: Record<string, string>) {
		this.textures = textures || {}
		this.verifyTextures()
	}

	addTexture(replaced: string, replacer: string) {
		this.textures[replaced] = replacer
	}

	removeTexture(replaced?: string, replacer?: string) {
		if (replaced) delete this.textures[replaced]
		else if (replacer) {
			for (const [replaced, replacer2] of Object.entries(this.textures)) {
				if (replacer2 === replacer) delete this.textures[replaced]
			}
		}
	}

	verifyTextures() {
		for (const [replaced, replacer] of Object.entries(this.textures)) {
			if (
				!(
					Project!.textures.find(t => t.uuid === replacer) &&
					Project!.textures.find(t => t.uuid === replaced)
				)
			) {
				console.log('Removing invalid texture from variant', this.name, replaced, replacer)
				delete this.textures[replaced]
			}
		}
		return true
	}
}

interface IVariantsContainerEvent {
	type: 'add' | 'remove' | 'select'
	variant?: Variant
}

export class VariantsContainer extends Subscribable<IVariantsContainerEvent> {
	variants: Record<string, Variant>
	_selectedVariant?: Variant
	constructor(variants?: Record<string, Variant>) {
		super()
		this.variants = variants || {}
		if (this.variants.default) {
			this.selectedVariant = this.variants.default
		}
	}

	get all() {
		return Object.values(this.variants)
	}

	get selectedVariant() {
		return this._selectedVariant
	}

	set selectedVariant(variant: Variant | undefined) {
		this._selectedVariant = variant
		this.dispatch({
			type: 'select',
			variant,
		})
	}

	select(variant: Variant) {
		this.selectedVariant = variant
	}

	addVariant(variant: Variant) {
		console.log('Adding variant: ' + variant.name)
		this.variants[variant.name] = variant
		this.dispatch({
			type: 'add',
			variant,
		})
	}

	removeVariant(variant: Variant) {
		console.log('Deleting variant: ' + variant.name)
		delete this.variants[variant.name]
		this.dispatch({
			type: 'remove',
			variant,
		})
	}

	verifyTextures() {
		for (const variant of this.all) {
			variant.verifyTextures()
		}
	}
}

export function getDefaultVariants() {
	return new VariantsContainer({ default: new Variant('default') })
}

function updateProjectVariants() {
	if (Project?.format.id === ajModelFormat.id) {
		if (!Project.animated_java_variants) {
			Project.animated_java_variants = getDefaultVariants()
		}
	}
	console.log('updateProjectVariants', Project)
}

Blockbench.on('load_project', updateProjectVariants)
Blockbench.on('select_project', updateProjectVariants)
