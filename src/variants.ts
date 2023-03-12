import { ajModelFormat } from './modelFormat'
import { openInvalidVariantPopup } from './ui/popups/invalidVariant'
import * as events from './events'
import { uuidRegex } from './util/misc'
import { Subscribable } from './util/subscribable'

export type TextureId = `${string}::${string}`
export type TextureMap = Record<TextureId, TextureId>
export interface ITextureMapping {
	from: TextureId
	fromUUID?: string
	fromName?: string
	fromTexture?: Texture
	fallbackFrom?: boolean
	to: TextureId
	toUUID?: string
	toName?: string
	toTexture?: Texture
	fallbackTo?: boolean
}

export class Variant {
	textureMap: TextureMap
	default?: boolean
	_name: string
	uuid: string
	constructor(
		name: string,
		textureMap?: TextureMap,
		uuid?: string,
		public affectedBones: Array<{ name: string; value: string }> = [],
		public affectedBonesIsAWhitelist = false
	) {
		this._name = name
		this.uuid = uuid || guid()
		this.textureMap = textureMap || {}
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

	addTextureMapping(from: TextureId, to: TextureId) {
		this.textureMap[from] = to
	}

	removeTextureMapping(from: TextureId) {
		delete this.textureMap[from]
	}

	getTexture(id: TextureId) {
		const [uuid, name] = id.split('::')
		let result = Texture.all.find(t => t.uuid === uuid)
		if (!result) result = Texture.all.find(t => t.name === name)
		return result
	}

	getMappedUuid(uuid: string): string | undefined {
		for (const [from, to] of Object.entries(this.textureMap)) {
			if (from.split('::')[0] === uuid) return to.split('::')[0]
		}
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
		let from: TextureId, to: TextureId
		// @ts-ignore
		for ([from, to] of Object.entries(this.textureMap)) {
			let fromUUID: string | undefined,
				fromName: string | undefined,
				toUUID: string | undefined,
				toName: string | undefined

			if (from.includes('::')) [fromUUID, fromName] = from.split('::')
			else if (from.match(uuidRegex)) fromUUID = from
			else fromName = from

			if (to.includes('::')) [toUUID, toName] = to.split('::')
			else if (to.match(uuidRegex)) toUUID = to
			else toName = to

			let fallbackFrom: boolean | undefined, fallbackTo: boolean | undefined

			const fromTexture = Texture.all.find(t => {
				if (t.uuid === fromUUID) return true
				if (t.name === fromName) {
					fallbackFrom = true
					return true
				}
			})
			const toTexture = Texture.all.find(t => {
				if (t.uuid === toUUID) return true
				if (t.name === toName) {
					fallbackTo = true
					return true
				}
			})

			yield {
				from,
				fromUUID,
				fromName,
				fromTexture,
				fallbackFrom,
				to,
				toUUID,
				toName,
				toTexture,
				fallbackTo,
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
			default: this.default,
			affectedBonesIsAWhitelist: this.affectedBonesIsAWhitelist,
			affectedBones: this.affectedBones,
		}
	}

	static fromJSON(json: {
		name: string
		textureMap: TextureMap
		uuid: string
		affectedBones?: Array<{ name: string; value: string }>
		affectedBonesIsAWhitelist?: boolean
	}) {
		return new Variant(
			json.name,
			json.textureMap,
			json.uuid,
			json.affectedBones,
			json.affectedBonesIsAWhitelist
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

// export function resetModelVariant() {
// 	Texture.all.forEach(t => t.updateMaterial())
// }

// export function applyModelVariant(variant: Variant) {
// 	if (!Project) return
// 	// console.log('variant', variant)
// 	variant.verifyTextures()

// 	resetModelVariant()

// 	for (const { fromUUID, toUUID } of variant.textureMapIterator()) {
// 		if (!fromUUID || !toUUID) {
// 			console.log('Skipping texture', fromUUID, toUUID)
// 			continue
// 		}
// 		const texture = Texture.all.find(t => t.uuid === toUUID)

// 		if (Project.materials[fromUUID] && texture) {
// 			// console.log('Updating texture', fromUUID, texture.name)
// 			// @ts-ignore
// 			Project.materials[fromUUID].map.image.src = texture.source
// 			// @ts-ignore
// 			Project.materials[fromUUID].map.needsUpdate = true
// 		}
// 	}

// 	Canvas.updateAllFaces()
// }

events.LOAD_PROJECT.subscribe(updateProjectVariants)
events.SELECT_PROJECT.subscribe(updateProjectVariants)
