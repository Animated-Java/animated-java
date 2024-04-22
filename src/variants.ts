import { IBlueprintVariantJSON } from './blueprintFormat'
import { events } from './util/events'
import { toSafeFuntionName } from './util/minecraftUtil'

export class TextureMap {
	map: Map<string, string>

	constructor() {
		this.map = new Map()
	}

	public add(key: string, value: string) {
		this.map.set(key, value)
	}

	public get(key: string) {
		return this.map.get(key)
	}

	public has(key: string) {
		return this.map.has(key)
	}

	public delete(key: string) {
		this.map.delete(key)
	}

	/**
	 * Given a texture or texture uuid, return the mapped texture
	 */
	public getMappedTexture(texture: Texture | string): Texture | undefined {
		const uuid = this.map.get(texture instanceof Texture ? texture.uuid : texture)
		return Texture.all.find(t => t.uuid === uuid)
	}

	public setMappedTexture(texture: Texture, mappedTexture: Texture) {
		this.map.set(texture.uuid, mappedTexture.uuid)
	}

	public toJSON() {
		return Object.fromEntries(this.map)
	}

	public static fromJSON(json: Record<string, string>): TextureMap {
		const textureMap = new TextureMap()
		for (const [key, value] of Object.entries(json)) {
			textureMap.add(key, value)
		}
		return textureMap
	}

	copy() {
		const textureMap = new TextureMap()
		textureMap.map = new Map(this.map)
		return textureMap
	}
}

export class VariantBoneConfig {
	bone: string

	constructor(bone: string) {
		this.bone = bone
	}
}

export class Variant {
	public static all: Variant[] = []
	public static selected: Variant | undefined

	public id: number
	public displayName: string
	public name: string
	public uuid: string
	public textureMap: TextureMap
	public isDefault = false
	public generateNameFromDisplayName = true
	public excludedBones: CollectionItem[] = []

	constructor(displayName: string, isDefault = false) {
		this.displayName = Variant.makeDisplayNameUnique(this, displayName)
		this.name = Variant.makeNameUnique(this, this.displayName)
		this.uuid = guid()
		this.isDefault = isDefault
		this.textureMap = new TextureMap()
		this.id = Variant.all.length
		Variant.all.push(this)
		this.select()
		events.CREATE_VARIANT.dispatch(this)
		// console.log(`Created variant: ${this.name} - ${this.id}`)
	}

	public select() {
		if (Variant.selected) Variant.selected.unselect()
		Variant.selected = this
		// console.log(`Selected variant: ${this.name}`)
		Canvas.updateAllFaces()
		events.SELECT_VARIANT.dispatch(this)
	}

	public unselect() {
		Variant.selected = undefined
	}

	public delete() {
		// Cannot delete default variant
		if (this.isDefault) return

		const index = Variant.all.indexOf(this)
		if (index > -1) {
			Variant.all.splice(index, 1)
		}

		if (Variant.selected === this) {
			this.unselect()
			Variant.selectDefault()
		}

		events.DELETE_VARIANT.dispatch(this)
	}

	public toJSON(): IBlueprintVariantJSON {
		return {
			display_name: this.displayName,
			name: this.name,
			uuid: this.uuid,
			texture_map: Object.fromEntries(this.textureMap.map),
			// TODO: Implement bone configs
			bone_configs: {},
			// TODO: Implement excluded bones
			excluded_bones: [],
		}
	}

	public static fromJSON(json: IBlueprintVariantJSON, isDefault = false): Variant {
		const variant = new Variant(json.display_name, isDefault)
		variant.uuid = json.uuid
		for (const [key, value] of Object.entries(json.texture_map)) {
			variant.textureMap.add(key, value)
		}
		// TODO: Implement bone configs
		// TODO: Implement excluded bones
		return variant
	}

	public static makeDisplayNameUnique(variant: Variant, displayName: string): string {
		let i = 1
		let newName = displayName
		while (Variant.all.some(v => v !== variant && v.displayName === newName)) {
			newName = `${displayName} ${i}`
			i++
		}
		return newName
	}

	public static makeNameUnique(variant: Variant, name: string): string {
		let i = 1
		let newName = toSafeFuntionName(name)
		while (Variant.all.some(v => v !== variant && v.name === newName)) {
			newName = toSafeFuntionName(`${name}_${i}`)
			i++
		}
		return newName
	}

	public static selectDefault() {
		const variant = Variant.all.find(v => v.isDefault)
		if (variant) variant.select()
	}

	public static getDefault(): Variant {
		return Variant.all.find(v => v.isDefault) ?? Variant.all[0]
	}
}

events.SELECT_PROJECT.subscribe(project => {
	project.variants ??= []
	Variant.all = project.variants
})
events.UNSELECT_PROJECT.subscribe(() => {
	Variant.all = []
})
