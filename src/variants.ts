import { IBlueprintVariantJSON } from './blueprintFormat'
import { events } from './util/events'

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
	public name: string
	public uuid: string
	public textureMap: TextureMap
	public isDefault = false

	constructor(name: string, isDefault = false) {
		this.name = name
		this.makeNameUnique()
		this.uuid = guid()
		this.isDefault = isDefault
		this.textureMap = new TextureMap()
		this.id = Variant.all.length
		Variant.all.push(this)
		this.select()
		events.CREATE_VARIANT.dispatch(this)
		console.log(`Created variant: ${this.name} - ${this.id}`)
	}

	public select() {
		if (Variant.selected) Variant.selected.unselect()
		Variant.selected = this
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
			Variant.all[Math.clamp(index - 1, 0, Variant.all.length)].select()
		}

		events.DELETE_VARIANT.dispatch(this)
	}

	public toJSON(): IBlueprintVariantJSON {
		return {
			name: this.name,
			uuid: this.uuid,
			texture_map: Object.fromEntries(this.textureMap.map),
			// TODO: Implement bone configs
			bone_configs: {},
			// TODO: Implement excluded bones
			excluded_bones: [],
			excluded_bones_is_whitelist: false,
		}
	}

	public static fromJSON(json: IBlueprintVariantJSON, isDefault = false): Variant {
		const variant = new Variant(json.name, isDefault)
		variant.uuid = json.uuid
		for (const [key, value] of Object.entries(json.texture_map)) {
			variant.textureMap.add(key, value)
		}
		// TODO: Implement bone configs
		// TODO: Implement excluded bones
		return variant
	}

	public makeNameUnique(): string {
		let i = 1
		let newName = this.name
		while (Variant.all.some(v => v.name === newName)) {
			newName = `${this.name} ${i}`
			i++
		}
		this.name = newName
		return newName
	}
}
