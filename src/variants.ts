import { IBlueprintVariantJSON } from './blueprintFormat'
import { PACKAGE } from './constants'
import { events } from './util/events'
import TransparentTexture from './assets/transparent.png'
import { toSafeFuntionName } from './util/minecraftUtil'

const OLD_PROJECT = Project
// @ts-ignore
Project = { materials: {} }
export const TRANSPARENT_TEXTURE = new Texture(
	{
		id: `${PACKAGE.name}:transparent_texture`,
		name: 'Transparent',
	},
	'797174ae-5c58-4a83-a630-eefd51007c80'
).fromDataURL(TransparentTexture)
export const TRANSPARENT_TEXTURE_MATERIAL = Project!.materials[TRANSPARENT_TEXTURE.uuid]
export const TRANSPARENT_TEXTURE_RESOURCE_LOCATION = 'animated_java:items/transparent'
Project = OLD_PROJECT

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
		if (uuid === TRANSPARENT_TEXTURE.uuid) return TRANSPARENT_TEXTURE
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
	}

	public select() {
		if (Variant.selected) Variant.selected.unselect()
		Variant.selected = this
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
			excluded_nodes: this.excludedBones.map(item => item.value),
		}
	}

	public duplicate() {
		const variant = new Variant(this.displayName, false)
		variant.uuid = guid()
		variant.isDefault = false
		variant.generateNameFromDisplayName = this.generateNameFromDisplayName
		variant.textureMap = this.textureMap.copy()
		variant.excludedBones = this.excludedBones.map(item => ({ ...item }))
		variant.select()
	}

	public static fromJSON(json: IBlueprintVariantJSON, isDefault = false): Variant {
		const variant = new Variant(json.display_name, isDefault)
		variant.uuid = json.uuid
		for (const [key, value] of Object.entries(json.texture_map)) {
			variant.textureMap.add(key, value)
		}
		variant.excludedBones = json.excluded_nodes
			.map(uuid => {
				const group = Group.all.find(group => group.uuid === uuid)
				return group ? { name: group.name, value: uuid } : undefined
			})
			.filter(Boolean) as CollectionItem[]
		return variant
	}

	public static makeDisplayNameUnique(variant: Variant, displayName: string): string {
		if (!Variant.all.some(v => v !== variant && v.displayName === displayName)) {
			return displayName
		}

		let i = 1
		const match = displayName.match(/\d+$/)
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

	public static makeNameUnique(variant: Variant, name: string): string {
		name = toSafeFuntionName(name)
		if (!Variant.all.some(v => v !== variant && v.name === name)) {
			return name
		}

		let i = 1
		const match = name.match(/\d+$/)
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
