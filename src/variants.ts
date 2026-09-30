import type { IBlueprintDisplayEntityConfigJSON, IBlueprintVariantJSON } from './formats/blueprint'
import { VanillaBlockDisplay } from './outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { getTextureSlot, previewSlots } from './textureSlots'
import type { IDisplayEntityConfigs } from './systems/rigRenderer'
import EVENTS from './util/events'
import { sanitizeStorageKey } from './util/minecraftUtil'
import { makeUniqueName } from './util/uniqueName'

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
	/** Slot UUID -> texture UUID. Slots left out are unchanged when the variant is applied. */
	slotTextures = new Map<string, string>()
	isDefault = false
	generateNameFromDisplayName = true
	onApplyFunction?: string
	excludedNodes = new Set<string>()

	constructor(displayName: string, isDefault = false) {
		if (isDefault && Variant.hasDefault()) {
			throw new Error('There can only be one default variant!')
		}
		this.displayName = Variant.makeDisplayNameUnique(this, displayName)
		this.name = Variant.makeNameUnique(this, this.displayName)
		this.isDefault = isDefault
		this.uuid = guid()
		this.id = Variant.all.length
		Variant.all.push(this)
		EVENTS.CREATE_VARIANT.publish(this)
	}

	select() {
		if (Variant.selected) Variant.selected.unselect()
		Variant.selected = this
		this.previewSlotTextures()
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

	/**
	 * Resets every slot's editor preview to its default, then shows this variant's textures.
	 */
	previewSlotTextures() {
		previewSlots(slot => this.slotTextures.get(slot.uuid))
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
			slot_textures: Object.fromEntries(this.slotTextures),
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
		variant.slotTextures = new Map(this.slotTextures)
		variant.excludedNodes = new Set(this.excludedNodes)
		variant.select()
	}

	/**
	 * Drops choices whose slot is gone or no longer holds the chosen texture.
	 */
	verifySlotTextures() {
		for (const [slotUuid, textureUuid] of this.slotTextures) {
			if (!getTextureSlot(slotUuid)?.slot_textures.includes(textureUuid)) {
				this.slotTextures.delete(slotUuid)
			}
		}
	}

	static fromJSON(json: IBlueprintVariantJSON, isDefault = false): Variant {
		const variant = new Variant(json.display_name, isDefault)
		variant.uuid = json.uuid
		if (json.name) variant.name = Variant.makeNameUnique(variant, json.name)
		variant.generateNameFromDisplayName =
			variant.name === Variant.makeNameUnique(variant, variant.displayName)
		variant.onApplyFunction = json.on_apply_function
		if (json.is_default) {
			return variant
		}
		for (const [slotUuid, textureUuid] of Object.entries(json.slot_textures ?? {})) {
			variant.slotTextures.set(slotUuid, textureUuid)
		}
		variant.excludedNodes = new Set(
			json.excluded_nodes
				.map(uuid => {
					const group = Group.all.find(group => group.uuid === uuid)
					return group ? uuid : undefined
				})
				.filter(v => v != undefined)
		)
		return variant
	}

	static makeDisplayNameUnique(variant: Variant, displayName: string): string {
		return makeUniqueName(displayName, name =>
			Variant.all.some(v => v !== variant && v.displayName === name)
		)
	}

	static makeNameUnique(variant: Variant, name: string): string {
		return makeUniqueName(sanitizeStorageKey(name), name =>
			Variant.all.some(v => v !== variant && v.name === name)
		)
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
	Variant.selected = undefined
})
