import { ajModelFormat } from './modelFormat'
import { BlockbenchMod } from './util/mods'
import { Subscribable } from './util/suscribable'
import { translate } from './util/translation'

export class Variant {
	textures: Record<string, string>
	_name: string
	constructor(name: string, textures?: Record<string, string>) {
		this._name = name
		this.textures = textures || {}
		this.verifyTextures()
	}

	get name() {
		return this._name
	}

	set name(name: string) {
		this._name = name
		if (Project && Project.animated_java_variants) {
			this.createUniqueName(Project.animated_java_variants.variants)
		}
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

	createUniqueName(otherVariants: Variant[]) {
		let name = this.name
		let i = 1
		while (otherVariants.find(v => v.name === name && v !== this)) {
			name = this.name.replace(/\d+$/, '') + i++
		}
		this._name = name
	}

	toJSON() {
		return {
			name: this.name,
			textures: this.textures,
		}
	}
}

interface IVariantsContainerEvent {
	type: 'add' | 'remove' | 'select'
	variant?: Variant
}

export class VariantsContainer extends Subscribable<IVariantsContainerEvent> {
	variants: Variant[]
	_selectedVariant?: Variant
	constructor(variants?: Variant[]) {
		super()
		this.variants = variants || []
		let v
		if ((v = this.variants.find(v => v.name === 'default'))) {
			this.selectedVariant = v
		}
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
		let v
		if ((v = this.variants.find(v => v.name === variant.name && v !== variant))) {
			this.variants.splice(this.variants.indexOf(v), 1, variant)
		} else this.variants.push(variant)
		this.dispatch({
			type: 'add',
			variant,
		})
		return variant
	}

	removeVariant(variant: Variant) {
		console.log('Deleting variant: ' + variant.name)
		this.variants.splice(this.variants.indexOf(variant), 1)
		this.dispatch({
			type: 'remove',
			variant,
		})
	}

	verifyTextures() {
		for (const variant of this.variants) {
			variant.verifyTextures()
		}
	}
}

export function getDefaultVariants() {
	return new VariantsContainer([new Variant('default')])
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
