import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtList, NbtString } from 'deepslate/lib/nbt'
import type {
	IBlueprintDisplayEntityConfigJSON,
	IBlueprintLocatorConfigJSON,
} from './formats/blueprint'
import { scrubUndefined } from './util/misc'

export type BillboardMode = 'fixed' | 'vertical' | 'horizontal' | 'center'

// TODO: Refactor these configs to inherit from a base class
export class DisplayEntityConfig {
	private __onApplyFunction?: string
	private __billboard?: BillboardMode
	private __overrideBrightness?: boolean
	private __brightnessOverride?: number
	private __enchanted?: boolean
	private __glowing?: boolean
	private __overrideGlowColor?: boolean
	private __glowColor?: string
	private __invisible?: boolean
	private __shadowRadius?: number
	private __shadowStrength?: number

	static getDefault(): DisplayEntityConfig {
		return DisplayEntityConfig.fromJSON({
			on_apply_function: '',
			billboard: 'fixed',
			override_brightness: false,
			brightness_override: 0,
			enchanted: false,
			glowing: false,
			override_glow_color: false,
			glow_color: '#ffffff',
			invisible: false,
			shadow_radius: 0,
			shadow_strength: 1,
		})
	}

	get onApplyFunction(): NonNullable<DisplayEntityConfig['__onApplyFunction']> {
		if (this.__onApplyFunction !== undefined) return this.__onApplyFunction
		return ''
	}
	set onApplyFunction(value: DisplayEntityConfig['__onApplyFunction']) {
		this.__onApplyFunction = value
	}

	get billboard(): NonNullable<DisplayEntityConfig['__billboard']> {
		if (this.__billboard !== undefined) return this.__billboard
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.billboard
	}
	set billboard(value: DisplayEntityConfig['__billboard']) {
		this.__billboard = value
	}

	get overrideBrightness(): NonNullable<DisplayEntityConfig['__overrideBrightness']> {
		if (this.__overrideBrightness !== undefined) return this.__overrideBrightness
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.overrideBrightness
	}
	set overrideBrightness(value: DisplayEntityConfig['__overrideBrightness']) {
		this.__overrideBrightness = value
	}

	get brightnessOverride(): NonNullable<DisplayEntityConfig['__brightnessOverride']> {
		if (this.__brightnessOverride !== undefined) return this.__brightnessOverride
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.brightnessOverride
	}
	set brightnessOverride(value: DisplayEntityConfig['__brightnessOverride']) {
		this.__brightnessOverride = value
	}

	get enchanted(): NonNullable<DisplayEntityConfig['__enchanted']> {
		if (this.__enchanted !== undefined) return this.__enchanted
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.enchanted
	}
	set enchanted(value: DisplayEntityConfig['__enchanted']) {
		this.__enchanted = value
	}

	get glowing(): NonNullable<DisplayEntityConfig['__glowing']> {
		if (this.__glowing !== undefined) return this.__glowing
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.glowing
	}
	set glowing(value: DisplayEntityConfig['__glowing']) {
		this.__glowing = value
	}

	get overrideGlowColor(): NonNullable<DisplayEntityConfig['__overrideGlowColor']> {
		if (this.__overrideGlowColor !== undefined) return this.__overrideGlowColor
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.overrideGlowColor
	}
	set overrideGlowColor(value: DisplayEntityConfig['__overrideGlowColor']) {
		this.__overrideGlowColor = value
	}

	get glowColor(): NonNullable<DisplayEntityConfig['__glowColor']> {
		if (this.__glowColor !== undefined) return this.__glowColor
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.glowColor
	}
	set glowColor(value: DisplayEntityConfig['__glowColor']) {
		this.__glowColor = value
	}

	get invisible(): NonNullable<DisplayEntityConfig['__invisible']> {
		if (this.__invisible !== undefined) return this.__invisible
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.invisible
	}
	set invisible(value: DisplayEntityConfig['__invisible']) {
		this.__invisible = value
	}

	get shadowRadius(): NonNullable<DisplayEntityConfig['__shadowRadius']> {
		if (this.__shadowRadius !== undefined) return this.__shadowRadius
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.shadowRadius
	}
	set shadowRadius(value: DisplayEntityConfig['__shadowRadius']) {
		this.__shadowRadius = value
	}

	get shadowStrength(): NonNullable<DisplayEntityConfig['__shadowStrength']> {
		if (this.__shadowStrength !== undefined) return this.__shadowStrength
		const defaultConfig = DisplayEntityConfig.getDefault()
		return defaultConfig.shadowStrength
	}
	set shadowStrength(value: DisplayEntityConfig['__shadowStrength']) {
		this.__shadowStrength = value
	}

	checkIfEqual(other: DisplayEntityConfig) {
		return (
			this.__onApplyFunction === other.__onApplyFunction &&
			this.__billboard === other.__billboard &&
			this.__overrideBrightness === other.__overrideBrightness &&
			this.__brightnessOverride === other.__brightnessOverride &&
			this.__enchanted === other.__enchanted &&
			this.__glowing === other.__glowing &&
			this.__overrideGlowColor === other.__overrideGlowColor &&
			this.__glowColor === other.__glowColor &&
			this.__invisible === other.__invisible &&
			this.__shadowRadius === other.__shadowRadius &&
			this.__shadowStrength === other.__shadowStrength
		)
	}

	isDefault(): boolean {
		return this.checkIfEqual(DisplayEntityConfig.getDefault())
	}

	toJSON(): IBlueprintDisplayEntityConfigJSON {
		return scrubUndefined({
			on_apply_function: this.__onApplyFunction,
			billboard: this.__billboard,
			override_brightness: this.__overrideBrightness,
			brightness_override: this.__brightnessOverride,
			enchanted: this.__enchanted,
			glowing: this.__glowing,
			override_glow_color: this.__overrideGlowColor,
			glow_color: this.__glowColor,
			invisible: this.__invisible,
			shadow_radius: this.__shadowRadius,
			shadow_strength: this.__shadowStrength,
		})
	}

	inheritFrom(other: DisplayEntityConfig) {
		if (other.__onApplyFunction !== undefined) this.onApplyFunction = other.onApplyFunction
		if (other.__billboard !== undefined) this.billboard = other.billboard
		if (other.__overrideBrightness !== undefined)
			this.overrideBrightness = other.overrideBrightness
		if (other.__brightnessOverride !== undefined)
			this.brightnessOverride = other.brightnessOverride
		if (other.__enchanted !== undefined) this.enchanted = other.enchanted
		if (other.__glowing !== undefined) this.glowing = other.glowing
		if (other.__overrideGlowColor !== undefined)
			this.overrideGlowColor = other.overrideGlowColor
		if (other.__glowColor !== undefined) this.glowColor = other.glowColor
		if (other.__invisible !== undefined) this.invisible = other.invisible
		if (other.__shadowRadius !== undefined) this.shadowRadius = other.shadowRadius
		if (other.__shadowStrength !== undefined) this.shadowStrength = other.shadowStrength
	}

	static fromJSON(json: IBlueprintDisplayEntityConfigJSON): DisplayEntityConfig {
		const config = new DisplayEntityConfig()
		if (json.on_apply_function !== undefined) config.__onApplyFunction = json.on_apply_function
		if (json.billboard !== undefined) config.__billboard = json.billboard
		if (json.override_brightness !== undefined)
			config.__overrideBrightness = json.override_brightness
		if (json.brightness_override !== undefined)
			config.__brightnessOverride = json.brightness_override
		if (json.enchanted !== undefined) config.__enchanted = json.enchanted
		if (json.glowing !== undefined) config.__glowing = json.glowing
		if (json.override_glow_color !== undefined)
			config.__overrideGlowColor = json.override_glow_color
		if (json.glow_color !== undefined) config.__glowColor = json.glow_color
		if (json.invisible !== undefined) config.__invisible = json.invisible
		if (json.shadow_radius !== undefined) config.__shadowRadius = json.shadow_radius
		if (json.shadow_strength !== undefined) config.__shadowStrength = json.shadow_strength
		return config
	}

	toNBT(compound: NbtCompound = new NbtCompound()): NbtCompound {
		if (this.__billboard) {
			compound.set('billboard', new NbtString(this.billboard))
		}

		if (this.overrideBrightness) {
			compound.set(
				'brightness',
				new NbtCompound()
					.set('block', new NbtFloat(this.brightnessOverride))
					.set('sky', new NbtFloat(this.brightnessOverride))
			)
		}

		if (this.enchanted) {
			const item = (compound.get('item') as NbtCompound) ?? new NbtCompound()
			if (!compareVersions('1.21.5', Project!.animated_java.target_minecraft_version)) {
				// >= 1.21.5
				const components = (item.get('components') as NbtCompound) ?? new NbtCompound()
				item.set('components', components)
				const enchantments =
					(components.get('minecraft:enchantments') as NbtCompound) ?? new NbtCompound()
				components.set('minecraft:enchantments', enchantments)
				enchantments.set('minecraft:infinity', new NbtInt(1))
			} else if (compareVersions(Project!.animated_java.target_minecraft_version, '1.20.4')) {
				// 1.20.5 - 1.21.4
				const components = (item.get('components') as NbtCompound) ?? new NbtCompound()
				item.set('components', components)
				const enchantments =
					(components.get('minecraft:enchantments') as NbtCompound) ?? new NbtCompound()
				components.set('minecraft:enchantments', enchantments)
				enchantments.set(
					'levels',
					new NbtCompound().set('minecraft:infinity', new NbtInt(1))
				)
			} else {
				// <= 1.20.4
				const tag = (item.get('tag') as NbtCompound) ?? new NbtCompound()
				item.set('tag', tag)
				const enchantments = (tag.get('Enchantments') as NbtList) ?? new NbtList()
				tag.set('Enchantments', enchantments)
				enchantments.add(
					new NbtCompound()
						.set('id', new NbtString('minecraft:infinity'))
						.set('lvl', new NbtInt(1))
				)
			}
			compound.set('item', item)
		}

		if (this.glowing) {
			compound.set('Glowing', new NbtByte(Number(this.glowing)))
		}
		if (this.overrideGlowColor) {
			compound.set(
				'glow_color_override',
				new NbtInt(Number(this.glowColor.replace('#', '0x')))
			)
		}

		// TODO Figure out a good solution for toggling a bone's visibility...
		// if (force || config.invisible !== defaultConfig.invisible) {
		// 	compound.set('invisible', new NbtByte(1))
		// }

		if (this.__shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this.__shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}
}

export class LocatorConfig {
	private __useEntity?: boolean
	private __entityType?: string
	private __syncPassengerRotation?: boolean
	private __onSummonFunction?: string
	private __onRemoveFunction?: string
	private __onTickFunction?: string

	getDefault(): LocatorConfig {
		return LocatorConfig.fromJSON({
			use_entity: false,
			entity_type: 'minecraft:pig',
			sync_passenger_rotation: false,
			on_summon_function: '',
			on_remove_function: '',
			on_tick_function: '',
		})
	}

	get useEntity(): NonNullable<LocatorConfig['__useEntity']> {
		if (this.__useEntity !== undefined) return this.__useEntity
		const defaultConfig = this.getDefault()
		return defaultConfig.useEntity
	}
	set useEntity(value: NonNullable<LocatorConfig['__useEntity']>) {
		this.__useEntity = value
	}

	get entityType(): NonNullable<LocatorConfig['__entityType']> {
		if (this.__entityType !== undefined) return this.__entityType
		const defaultConfig = this.getDefault()
		return defaultConfig.entityType
	}
	set entityType(value: NonNullable<LocatorConfig['__entityType']>) {
		this.__entityType = value
	}

	get syncPassengerRotation(): NonNullable<LocatorConfig['__syncPassengerRotation']> {
		if (this.__syncPassengerRotation !== undefined) return this.__syncPassengerRotation
		const defaultConfig = this.getDefault()
		return defaultConfig.syncPassengerRotation
	}
	set syncPassengerRotation(value: NonNullable<LocatorConfig['__syncPassengerRotation']>) {
		this.__syncPassengerRotation = value
	}

	get onSummonFunction(): NonNullable<LocatorConfig['__onSummonFunction']> {
		if (this.__onSummonFunction !== undefined) return this.__onSummonFunction
		const defaultConfig = this.getDefault()
		return defaultConfig.onSummonFunction
	}
	set onSummonFunction(value: NonNullable<LocatorConfig['__onSummonFunction']>) {
		this.__onSummonFunction = value
	}

	get onRemoveFunction(): NonNullable<LocatorConfig['__onRemoveFunction']> {
		if (this.__onRemoveFunction !== undefined) return this.__onRemoveFunction
		const defaultConfig = this.getDefault()
		return defaultConfig.onRemoveFunction
	}
	set onRemoveFunction(value: NonNullable<LocatorConfig['__onRemoveFunction']>) {
		this.__onRemoveFunction = value
	}

	get onTickFunction(): NonNullable<LocatorConfig['__onTickFunction']> {
		if (this.__onTickFunction !== undefined) return this.__onTickFunction
		const defaultConfig = this.getDefault()
		return defaultConfig.onTickFunction
	}
	set onTickFunction(value: NonNullable<LocatorConfig['__onTickFunction']>) {
		this.__onTickFunction = value
	}

	toJSON(): IBlueprintLocatorConfigJSON {
		return scrubUndefined({
			use_entity: this.__useEntity,
			entity_type: this.__entityType,
			sync_passenger_rotation: this.__syncPassengerRotation,
			on_summon_function: this.__onSummonFunction,
			on_remove_function: this.__onRemoveFunction,
			on_tick_function: this.__onTickFunction,
		})
	}

	static fromJSON(json: IBlueprintLocatorConfigJSON): LocatorConfig {
		const config = new LocatorConfig()
		if (json.use_entity !== undefined) config.__useEntity = json.use_entity
		if (json.entity_type !== undefined) config.__entityType = json.entity_type
		if (json.sync_passenger_rotation !== undefined)
			config.__syncPassengerRotation = json.sync_passenger_rotation
		if (json.on_summon_function !== undefined)
			config.__onSummonFunction = json.on_summon_function
		if (json.on_remove_function !== undefined)
			config.__onRemoveFunction = json.on_remove_function
		if (json.on_tick_function !== undefined) config.__onTickFunction = json.on_tick_function
		return config
	}

	isDefault(): boolean {
		return this.checkIfEqual(new LocatorConfig())
	}

	checkIfEqual(other: LocatorConfig) {
		return (
			this.useEntity === other.useEntity &&
			this.entityType === other.entityType &&
			this.syncPassengerRotation === other.syncPassengerRotation &&
			this.onSummonFunction === other.onSummonFunction &&
			this.onRemoveFunction === other.onRemoveFunction &&
			this.onTickFunction === other.onTickFunction
		)
	}
}
