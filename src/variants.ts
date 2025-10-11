import type { IBlueprintVariantJSON } from './formats/blueprint'
import EVENTS from './util/events'
import { sanitizeStorageKey } from './util/minecraftUtil'

export class TextureMap {
	map: Map<string, string>

	constructor() {
		this.map = new Map()
	}

	add(key: string, value: string) {
		this.map.set(key, value)
	}

	get(key: string) {
		return this.map.get(key)
	}

	has(key: string) {
		return this.map.has(key)
	}

	delete(key: string) {
		this.map.delete(key)
	}

	/**
	 * Given a texture or texture uuid, return the mapped texture
	 */
	getMappedTexture(texture: Texture | string): Texture | undefined {
		const uuid = this.map.get(texture instanceof Texture ? texture.uuid : texture)
		return Texture.all.find(t => t.uuid === uuid)
	}

	setMappedTexture(texture: Texture, mappedTexture: Texture) {
		this.map.set(texture.uuid, mappedTexture.uuid)
	}

	toJSON() {
		return Object.fromEntries(this.map)
	}

	static fromJSON(json: Record<string, string>): TextureMap {
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

	verifyTextures() {
		for (const [key, value] of this.map) {
			if (!Texture.all.some(t => t.uuid === value)) {
				this.map.delete(key)
			}
		}
	}
}

export class VariantBoneConfig {
	bone: string

	constructor(bone: string) {
		this.bone = bone
	}
}

export class Variant {
	static all: Variant[] = []
	static selected: Variant | undefined

	id: number
	displayName: string
	name: string
	uuid: string
	textureMap: TextureMap
	isDefault = false
	generateNameFromDisplayName = true
	excludedNodes: CollectionItem[] = []

	constructor(displayName: string, isDefault = false) {
		this.displayName = Variant.makeDisplayNameUnique(this, displayName)
		this.name = Variant.makeNameUnique(this, this.displayName)
		this.isDefault = isDefault
		this.uuid = guid()
		this.textureMap = new TextureMap()
		this.id = Variant.all.length
		if (this.isDefault) {
			this.displayName = 'Default'
			this.name = 'default'
		}
		Variant.all.push(this)
		// this.select()
		EVENTS.CREATE_VARIANT.publish(this)
	}

	select() {
		if (Variant.selected) Variant.selected.unselect()
		Variant.selected = this
		Canvas.updateAllFaces()
		EVENTS.SELECT_VARIANT.publish(this)
	}

	unselect() {
		Variant.selected = undefined
	}

	delete() {
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

		EVENTS.DELETE_VARIANT.publish(this)
	}

	toJSON() {
		const json: IBlueprintVariantJSON = {
			name: this.name,
			display_name: this.displayName,
			uuid: this.uuid,
			texture_map: Object.fromEntries(this.textureMap.map),
			excluded_nodes: this.excludedNodes.map(item => item.value),
		}
		if (this.isDefault) {
			json.is_default = true
		}
		return json
	}

	duplicate() {
		const variant = new Variant(this.displayName, false)
		variant.uuid = guid()
		variant.isDefault = false
		variant.generateNameFromDisplayName = this.generateNameFromDisplayName
		variant.textureMap = this.textureMap.copy()
		variant.excludedNodes = this.excludedNodes.map(item => ({ ...item }))
		variant.select()
	}

	verifyTextureMap() {
		this.textureMap.verifyTextures()
	}

	static fromJSON(json: IBlueprintVariantJSON, isDefault = false): Variant {
		const variant = new Variant(json.display_name, isDefault)
		variant.uuid = json.uuid
		if (json.is_default) {
			return variant
		}
		for (const [key, value] of Object.entries(json.texture_map)) {
			variant.textureMap.add(key, value)
		}
		variant.excludedNodes = json.excluded_nodes
			.map(uuid => {
				const group = Group.all.find(group => group.uuid === uuid)
				return group ? { name: group.name, value: uuid } : undefined
			})
			.filter(Boolean) as CollectionItem[]
		return variant
	}

	static makeDisplayNameUnique(variant: Variant, displayName: string): string {
		if (!Variant.all.some(v => v !== variant && v.displayName === displayName)) {
			return displayName
		}

		let i = 1
		const match = /\d+$/.exec(displayName)
		if (match) {
			i = parseInt(match[0])
			displayName = displayName.slice(0, -match[0].length)
		}

		let maxTries = 1000
		while (maxTries-- > 0) {
			const newName = `${displayName}${i}`
			if (!Variant.all.some(v => v !== variant && v.displayName === newName)) {
				return newName
			}
			i++
		}

		throw new Error('Could not make Variant display name unique!')
	}

	static makeNameUnique(variant: Variant, name: string): string {
		name = sanitizeStorageKey(name)
		if (!Variant.all.some(v => v !== variant && v.name === name)) {
			return name
		}

		let i = 1
		const match = /\d+$/.exec(name)
		if (match) {
			i = parseInt(match[0])
			name = name.slice(0, -match[0].length)
		}

		let maxTries = 1000
		while (maxTries-- > 0) {
			const newName = `${name}${i}`
			if (!Variant.all.some(v => v !== variant && v.name === newName)) {
				return newName
			}
			i++
		}

		throw new Error('Could not make Variant name unique!')
	}

	static selectDefault() {
		const variant = Variant.all.find(v => v.isDefault)
		if (variant) variant.select()
	}

	static getDefault(): Variant {
		return Variant.all.find(v => v.isDefault) ?? Variant.all[0]
	}
}

EVENTS.SELECT_PROJECT.subscribe(project => {
	project.variants ??= []
	Variant.all = project.variants
})
EVENTS.UNSELECT_PROJECT.subscribe(() => {
	Variant.all = []
})
