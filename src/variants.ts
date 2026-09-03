import type { IBlueprintDisplayEntityConfigJSON, IBlueprintVariantJSON } from './formats/blueprint'
import { VanillaBlockDisplay } from './outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import type { IDisplayEntityConfigs } from './systems/rigRenderer'
import EVENTS from './util/events'
import { sanitizeStorageKey } from './util/minecraftUtil'

const TEXTURE_BY_UUID_CACHE = new Map<string, Texture>()

export class TextureMap extends Map<string, string> {
	add(key: string, value: string) {
		this.set(key, value)
	}

	/**
	 * Given a texture or texture uuid, return the mapped texture
	 */
	getMappedTexture(texture: Texture | string): Texture | undefined {
		const uuid = this.get(texture instanceof Texture ? texture.uuid : texture)
		if (!uuid) return undefined

		let cached = TEXTURE_BY_UUID_CACHE.get(uuid)
		if (!cached) {
			cached = Texture.all.find(t => t.uuid === uuid)
			if (cached) TEXTURE_BY_UUID_CACHE.set(uuid, cached)
		}

		return cached
	}

	setMappedTexture(texture: Texture, mappedTexture: Texture) {
		this.set(texture.uuid, mappedTexture.uuid)
	}

	toJSON() {
		return Object.fromEntries(this)
	}

	static fromJSON(json: Record<string, string>): TextureMap {
		const textureMap = new TextureMap()
		for (const [key, value] of Object.entries(json)) {
			textureMap.add(key, value)
		}
		return textureMap
	}

	copy() {
		return new TextureMap(this)
	}

	verifyTextures() {
		for (const [key, value] of this) {
			if (!Texture.all.some(t => t.uuid === value)) {
				this.delete(key)
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
	onApplyFunction?: string
	excludedNodes = new Set<string>()

	constructor(displayName: string, isDefault = false) {
		this.displayName = Variant.makeDisplayNameUnique(this, displayName)
		this.name = Variant.makeNameUnique(this, this.displayName)
		this.isDefault = isDefault
		this.uuid = guid()
		this.textureMap = new TextureMap()
		this.id = Variant.all.length
		if (this.isDefault) {
			if (Variant.hasDefault()) {
				throw new Error('There can only be one default variant!')
			}
			this.displayName = 'Default'
			this.name = 'default'
		}
		Variant.all.push(this)
		EVENTS.CREATE_VARIANT.publish(this)
	}

	select() {
		if (Variant.selected) Variant.selected.unselect()
		Variant.selected = this
		Canvas.updateAllFaces()
		VanillaBlockDisplay.forceUpdateAll()
		VanillaItemDisplay.forceUpdateAll()
		EVENTS.SELECT_VARIANT.publish(this)
	}

	getDisplayEntityConfig(
		element: OutlinerElement & { configs: IDisplayEntityConfigs }
	): IBlueprintDisplayEntityConfigJSON {
		if (this.isDefault) {
			return element.configs.default
		} else {
			return element.configs.variants[this.uuid] ?? element.configs.default
		}
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
			texture_map: Object.fromEntries(this.textureMap),
			excluded_nodes: [...this.excludedNodes.keys()],
			on_apply_function: this.onApplyFunction,
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
		variant.excludedNodes = new Set(this.excludedNodes)
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
		variant.excludedNodes = new Set(
			json.excluded_nodes
				.map(uuid => {
					const group = Group.all.find(group => group.uuid === uuid)
					return group ? uuid : undefined
				})
				.filter(v => v != undefined)
		)
		variant.onApplyFunction = json.on_apply_function
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
		Variant.getDefault().select()
	}

	static getByUUID(uuid: string): Variant | undefined {
		return Variant.all.find(v => v.uuid === uuid)
	}

	static allExcludingDefault(): Variant[] {
		return Variant.all.filter(v => !v.isDefault)
	}

	static hasDefault(): boolean {
		return Variant.all.some(v => v.isDefault)
	}

	static getDefault(): Variant {
		return Variant.all.find(v => v.isDefault) ?? new Variant('Default', true)
	}
}

EVENTS.SELECT_PROJECT.subscribe(project => {
	project.variants ??= []
	Variant.all = project.variants
})
EVENTS.UNSELECT_PROJECT.subscribe(() => {
	Variant.all = []
})
