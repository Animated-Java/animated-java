import { ajModelFormat } from './modelFormat'
import { openInvalidVariantPopup } from './ui/popups/invalidVariant'
import * as events from './events'
import { Subscribable } from './util/subscribable'

export type TextureMap = Record<string, string>
export interface ITextureMapping {
	from: string
	fromTexture?: Texture
	to: string
	toTexture?: Texture
}

export interface IBoneConfig {
	nbt: string
}

export class Variant {
	textureMap: TextureMap
	boneConfig: Record<string, IBoneConfig>
	default?: boolean
	_name: string
	uuid: string
	constructor(
		name: string,
		textureMap?: TextureMap,
		uuid?: string,
		boneConfig?: Record<string, IBoneConfig>,
		public affectedBones: Array<{ name: string; value: string }> = [],
		public affectedBonesIsAWhitelist = false
	) {
		this._name = name
		this.uuid = uuid || guid()
		this.textureMap = textureMap || {}
		this.boneConfig = boneConfig || {}
	}

	get name() {
		return this._name
	}

	set name(name: string) {
		this._name = name
		if (Project?.animated_java_variants) {
			this.createUniqueName(Project.animated_java_variants.variants)
		}
	}

	addTextureMapping(from: string, to: string) {
		this.textureMap[from] = to
	}

	removeTextureMapping(from: string) {
		delete this.textureMap[from]
	}

	getTexture(id: string) {
		const result = Texture.all.find(t => t.uuid === id)
		return result
	}

	getMappedUuid(uuid: string): string | undefined {
		const result = Object.entries(this.textureMap).find(([from]) => from === uuid)
		return result ? result[1] : undefined
	}

	verifyTextures(silent = false) {
		const removedMappings: ITextureMapping[] = []
		for (const mapping of this.textureMapIterator()) {
			// console.log('textureMap', this.textureMap, 'mapping', mapping)
			if (!(mapping.fromTexture && mapping.toTexture)) {
				console.log(
					`Removing invalid texture mapping from variant '${this.name}':`,
					mapping
				)
				removedMappings.push(mapping)
				this.removeTextureMapping(mapping.from)
			}
			if (mapping.from === mapping.to) {
				console.log(
					`Removing redundant texture mapping from variant '${this.name}':`,
					mapping
				)
				this.removeTextureMapping(mapping.from)
			}
		}
		const valid = removedMappings.length === 0

		if (silent) return valid
		if (!valid) {
			if (Animator.open && Timeline.playing) Timeline.pause()
			openInvalidVariantPopup(this, removedMappings)
		}
		return valid
	}

	*textureMapIterator(): Generator<ITextureMapping, void, unknown> {
		let from: string, to: string
		// @ts-ignore
		for ([from, to] of Object.entries(this.textureMap)) {
			const fromTexture = Texture.all.find(t => t.uuid === from)
			const toTexture = Texture.all.find(t => t.uuid === to)

			yield {
				from,
				fromTexture,
				to,
				toTexture,
			}
		}
	}

	createUniqueName(otherVariants: Variant[]) {
		let name = this.name
		let i = 1
		while (otherVariants.find(v => v.name === name && v !== this)) {
			name = `${this.name.replace(/\d+$/, '')}${i++}`
		}
		this._name = name
	}

	toJSON() {
		return {
			name: this.name,
			textureMap: this.textureMap,
			uuid: this.uuid,
			boneConfig: this.boneConfig,
			default: this.default,
			affectedBonesIsAWhitelist: this.affectedBonesIsAWhitelist,
			affectedBones: this.affectedBones,
		}
	}

	static fromJSON(json: {
		name: string
		textureMap: TextureMap
		uuid: string
		boneConfig: Record<string, IBoneConfig>
		affectedBones?: Array<{ name: string; value: string }>
		affectedBonesIsAWhitelist?: boolean
	}) {
		return new Variant(
			json.name,
			json.textureMap,
			json.uuid,
			json.boneConfig,
			json.affectedBones,
			json.affectedBonesIsAWhitelist
		)
	}

	clone(): Variant {
		return new Variant(
			this.name,
			{ ...this.textureMap },
			guid(),
			{ ...this.boneConfig },
			this.affectedBones,
			this.affectedBonesIsAWhitelist
		)
	}
}

interface IVariantsContainerEvent {
	type: 'add' | 'remove' | 'select'
	variant?: Variant
}

export class VariantsContainer extends Subscribable<IVariantsContainerEvent> {
	variants: Variant[]
	private _selectedVariant?: Variant
	constructor(variants?: Variant[]) {
		super()
		this.variants = variants || []
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

	select(variant: Variant = this.defaultVariant) {
		this.selectedVariant = variant
		Canvas.updateAllFaces()
		requestAnimationFrame(() => {
			Canvas.updateAllFaces()
		})
	}

	addVariant(variant: Variant, isDefault = false): Variant {
		console.log('Adding variant: ' + variant.name)

		let v
		if (
			(v = this.variants.find(
				v => (v.name === variant.name || v.uuid === variant.uuid) && v !== variant
			))
		) {
			this.variants.splice(this.variants.indexOf(v), 1, variant)
		} else this.variants.push(variant)

		if (isDefault || this.variants.length === 1) this.defaultVariant = variant

		this.sortVariants()

		this.dispatch({
			type: 'add',
			variant,
		})
		return variant
	}

	removeVariant(variant: Variant) {
		// Can't delete default variant
		if (variant.default) return
		console.log('Deleting variant: ' + variant.name)
		this.variants.splice(this.variants.indexOf(variant), 1)
		// Make sure we don't have an empty variant list
		if (this.variants.length === 0) {
			const v = new Variant('default')
			this.defaultVariant = this.addVariant(v)
		}
		// Select the default variant if we're deleting the selected variant
		if (this.selectedVariant === variant) {
			this.select(this.defaultVariant)
		}

		this.dispatch({
			type: 'remove',
			variant,
		})
	}

	get defaultVariant() {
		const result = this.variants.find(v => v.default)
		if (!result) {
			console.log('No default variant found, setting first variant as default')
			if (this.variants.length === 0) {
				console.log('No variants found, creating default variant')
				return (this.defaultVariant = this.addVariant(new Variant('default')))
			}
			return (this.defaultVariant = this.variants[0])
		}
		return result
	}

	set defaultVariant(variant: Variant) {
		variant.default = true
		variant.textureMap = {}
		variant.affectedBones = []
		variant.affectedBonesIsAWhitelist = false
		for (const v of this.variants) {
			if (v !== variant) v.default = false
		}
	}

	verifyTextures(silent = false) {
		for (const variant of this.variants) {
			variant.verifyTextures(silent)
		}
	}

	sortVariants() {
		this.variants.sort((a, b) => {
			if (a.default) return -1
			if (b.default) return 1
			return a.name.localeCompare(b.name)
		})
	}
}

function updateProjectVariants() {
	if (!Project) return
	if (Format === ajModelFormat) {
		if (!Project.animated_java_variants)
			Project.animated_java_variants = new VariantsContainer()
		Project.animated_java_variants.verifyTextures()
	}
	console.log('updateProjectVariants', Project)
}

events.LOAD_PROJECT.subscribe(updateProjectVariants)
events.CONVERT_PROJECT.subscribe(updateProjectVariants)
events.SELECT_PROJECT.subscribe(updateProjectVariants)
