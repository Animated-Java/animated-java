import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtString, NbtTag } from 'deepslate'
import {
	IBlueprintBoneConfigJSON,
	IBlueprintCameraConfigJSON,
	IBlueprintLocatorConfigJSON,
	IBlueprintTextDisplayConfigJSON,
} from './blueprintFormat'

export type BillboardMode = 'fixed' | 'vertical' | 'horizontal' | 'center'

// TODO: Refactor these configs to inherit from a base class
export class BoneConfig {
	private _vanillaModel?: string
	private _billboard?: BillboardMode
	private _overrideBrightness?: boolean
	private _brightnessOverride?: number
	private _enchanted?: boolean
	private _glowing?: boolean
	private _overrideGlowColor?: boolean
	private _glowColor?: string
	private _inheritSettings?: boolean
	private _invisible?: boolean
	private _nbt?: string
	private _shadowRadius?: number
	private _shadowStrength?: number
	private _useNBT?: boolean

	static getDefault(): BoneConfig {
		return BoneConfig.fromJSON({
			billboard: 'fixed',
			override_brightness: false,
			brightness_override: 0,
			enchanted: false,
			glowing: false,
			override_glow_color: false,
			glow_color: '#ffffff',
			inherit_settings: true,
			invisible: false,
			nbt: '{}',
			shadow_radius: 0,
			shadow_strength: 1,
			use_nbt: false,
		})
	}

	get billboard(): NonNullable<BoneConfig['_billboard']> {
		if (this._billboard !== undefined) return this._billboard
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.billboard
	}
	set billboard(value: BoneConfig['_billboard']) {
		this._billboard = value
	}

	get overrideBrightness(): NonNullable<BoneConfig['_overrideBrightness']> {
		if (this._overrideBrightness !== undefined) return this._overrideBrightness
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.overrideBrightness
	}
	set overrideBrightness(value: BoneConfig['_overrideBrightness']) {
		this._overrideBrightness = value
	}

	get brightnessOverride(): NonNullable<BoneConfig['_brightnessOverride']> {
		if (this._brightnessOverride !== undefined) return this._brightnessOverride
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.brightnessOverride
	}
	set brightnessOverride(value: BoneConfig['_brightnessOverride']) {
		this._brightnessOverride = value
	}

	get enchanted(): NonNullable<BoneConfig['_enchanted']> {
		if (this._enchanted !== undefined) return this._enchanted
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.enchanted
	}
	set enchanted(value: BoneConfig['_enchanted']) {
		this._enchanted = value
	}

	get glowing(): NonNullable<BoneConfig['_glowing']> {
		if (this._glowing !== undefined) return this._glowing
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.glowing
	}
	set glowing(value: BoneConfig['_glowing']) {
		this._glowing = value
	}

	get overrideGlowColor(): NonNullable<BoneConfig['_overrideGlowColor']> {
		if (this._overrideGlowColor !== undefined) return this._overrideGlowColor
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.overrideGlowColor
	}
	set overrideGlowColor(value: BoneConfig['_overrideGlowColor']) {
		this._overrideGlowColor = value
	}

	get glowColor(): NonNullable<BoneConfig['_glowColor']> {
		if (this._glowColor !== undefined) return this._glowColor
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.glowColor
	}
	set glowColor(value: BoneConfig['_glowColor']) {
		this._glowColor = value
	}

	get inheritSettings(): NonNullable<BoneConfig['_inheritSettings']> {
		if (this._inheritSettings !== undefined) return this._inheritSettings
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.inheritSettings
	}
	set inheritSettings(value: BoneConfig['_inheritSettings']) {
		this._inheritSettings = value
	}

	get invisible(): NonNullable<BoneConfig['_invisible']> {
		if (this._invisible !== undefined) return this._invisible
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.invisible
	}
	set invisible(value: BoneConfig['_invisible']) {
		this._invisible = value
	}

	get nbt(): NonNullable<BoneConfig['_nbt']> {
		if (this._nbt !== undefined) return this._nbt
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.nbt
	}
	set nbt(value: BoneConfig['_nbt']) {
		this._nbt = value
	}

	get shadowRadius(): NonNullable<BoneConfig['_shadowRadius']> {
		if (this._shadowRadius !== undefined) return this._shadowRadius
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.shadowRadius
	}
	set shadowRadius(value: BoneConfig['_shadowRadius']) {
		this._shadowRadius = value
	}

	get shadowStrength(): NonNullable<BoneConfig['_shadowStrength']> {
		if (this._shadowStrength !== undefined) return this._shadowStrength
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.shadowStrength
	}
	set shadowStrength(value: BoneConfig['_shadowStrength']) {
		this._shadowStrength = value
	}

	get useNBT(): NonNullable<BoneConfig['_useNBT']> {
		if (this._useNBT !== undefined) return this._useNBT
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.useNBT
	}
	set useNBT(value: BoneConfig['_useNBT']) {
		this._useNBT = value
	}

	public checkIfEqual(other: BoneConfig) {
		return (
			this._vanillaModel === other._vanillaModel &&
			this._billboard === other._billboard &&
			this._overrideBrightness === other._overrideBrightness &&
			this._brightnessOverride === other._brightnessOverride &&
			this._enchanted === other._enchanted &&
			this._glowing === other._glowing &&
			this._overrideGlowColor === other._overrideGlowColor &&
			this._glowColor === other._glowColor &&
			this._inheritSettings === other._inheritSettings &&
			this._invisible === other._invisible &&
			this._nbt === other._nbt &&
			this._shadowRadius === other._shadowRadius &&
			this._shadowStrength === other._shadowStrength &&
			this._useNBT === other._useNBT
		)
	}

	public isDefault(): boolean {
		return this.checkIfEqual(BoneConfig.getDefault())
	}

	public toJSON(): IBlueprintBoneConfigJSON {
		return {
			billboard: this._billboard,
			override_brightness: this._overrideBrightness,
			brightness_override: this._brightnessOverride,
			enchanted: this._enchanted,
			glowing: this._glowing,
			override_glow_color: this._overrideGlowColor,
			glow_color: this._glowColor,
			inherit_settings: this._inheritSettings,
			invisible: this._invisible,
			nbt: this._nbt,
			shadow_radius: this._shadowRadius,
			shadow_strength: this._shadowStrength,
			use_nbt: this._useNBT,
		}
	}

	inheritFrom(other: BoneConfig) {
		if (other._billboard !== undefined) this.billboard = other.billboard
		if (other._overrideBrightness !== undefined)
			this.overrideBrightness = other.overrideBrightness
		if (other._brightnessOverride !== undefined)
			this.brightnessOverride = other.brightnessOverride
		if (other._enchanted !== undefined) this.enchanted = other.enchanted
		if (other._glowing !== undefined) this.glowing = other.glowing
		if (other._overrideGlowColor !== undefined) this.overrideGlowColor = other.overrideGlowColor
		if (other._glowColor !== undefined) this.glowColor = other.glowColor
		if (other._inheritSettings !== undefined) this.inheritSettings = other.inheritSettings
		if (other._invisible !== undefined) this.invisible = other.invisible
		if (other._nbt !== undefined) this.nbt = other.nbt
		if (other._shadowRadius !== undefined) this.shadowRadius = other.shadowRadius
		if (other._shadowStrength !== undefined) this.shadowStrength = other.shadowStrength
		if (other._useNBT !== undefined) this.useNBT = other.useNBT
	}

	public static fromJSON(json: IBlueprintBoneConfigJSON): BoneConfig {
		const config = new BoneConfig()
		if (json.billboard !== undefined) config._billboard = json.billboard
		if (json.override_brightness !== undefined)
			config._overrideBrightness = json.override_brightness
		if (json.brightness_override !== undefined)
			config._brightnessOverride = json.brightness_override
		if (json.enchanted !== undefined) config._enchanted = json.enchanted
		if (json.glowing !== undefined) config._glowing = json.glowing
		if (json.override_glow_color !== undefined)
			config._overrideGlowColor = json.override_glow_color
		if (json.glow_color !== undefined) config._glowColor = json.glow_color
		if (json.inherit_settings !== undefined) config._inheritSettings = json.inherit_settings
		if (json.invisible !== undefined) config._invisible = json.invisible
		if (json.nbt !== undefined) config._nbt = json.nbt
		if (json.shadow_radius !== undefined) config._shadowRadius = json.shadow_radius
		if (json.shadow_strength !== undefined) config._shadowStrength = json.shadow_strength
		if (json.use_nbt !== undefined) config._useNBT = json.use_nbt
		return config
	}

	public toNBT(compound: NbtCompound = new NbtCompound()): NbtCompound {
		// if (this.vanillaItemModel) {
		// 	const item = (compound.get('item') as NbtCompound) || new NbtCompound()
		// 	compound.set('item', item.set('id', new NbtString(this.vanillaItemModel)))
		// 	compound.set('item_display', new NbtString('none'))
		// }

		if (this.useNBT) {
			const newData = NbtTag.fromString(this.nbt) as NbtCompound
			for (const key of newData.keys()) {
				compound.set(key, newData.get(key)!)
			}
			return compound
		}

		if (this._billboard) {
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
			const item = (compound.get('item') as NbtCompound) || new NbtCompound()
			compound.set(
				'item',
				item.set(
					'components',
					new NbtCompound().set(
						'minecraft:enchantments',
						new NbtCompound().set(
							'levels',
							new NbtCompound().set('minecraft:infinity', new NbtInt(1))
						)
					)
				)
			)
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

		if (this._shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this._shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}
}

export class LocatorConfig {
	private _tickingCommands?: string

	getDefault(): LocatorConfig {
		return LocatorConfig.fromJSON({
			ticking_commands: '',
		})
	}

	get tickingCommands(): NonNullable<LocatorConfig['_tickingCommands']> {
		if (this._tickingCommands !== undefined) return this._tickingCommands
		const defaultConfig = this.getDefault()
		return defaultConfig.tickingCommands
	}
	set tickingCommands(value: NonNullable<LocatorConfig['_tickingCommands']>) {
		this._tickingCommands = value
	}

	public toJSON(): IBlueprintLocatorConfigJSON {
		return {
			ticking_commands: this._tickingCommands,
		}
	}

	public static fromJSON(json: IBlueprintLocatorConfigJSON): LocatorConfig {
		const config = new LocatorConfig()
		if (json.ticking_commands !== undefined) config._tickingCommands = json.ticking_commands
		return config
	}

	public isDefault(): boolean {
		return this.checkIfEqual(new LocatorConfig())
	}

	public checkIfEqual(other: LocatorConfig) {
		return this._tickingCommands === other._tickingCommands
	}
}

export class CameraConfig {
	private _entityType?: string
	private _nbt?: string
	private _tickingCommands?: string

	getDefault(): CameraConfig {
		return CameraConfig.fromJSON({
			entity_type: 'minecraft:item_display',
			nbt: '{}',
			ticking_commands: '',
		})
	}

	get entityType(): NonNullable<CameraConfig['_entityType']> {
		if (this._entityType !== undefined) return this._entityType
		const defaultConfig = this.getDefault()
		return defaultConfig.entityType
	}
	set entityType(value: NonNullable<CameraConfig['_entityType']>) {
		this._entityType = value
	}

	get nbt(): NonNullable<CameraConfig['_nbt']> {
		if (this._nbt !== undefined) return this._nbt
		const defaultConfig = this.getDefault()
		return defaultConfig.nbt
	}
	set nbt(value: NonNullable<CameraConfig['_nbt']>) {
		this._nbt = value
	}

	get tickingCommands(): NonNullable<CameraConfig['_tickingCommands']> {
		if (this._tickingCommands !== undefined) return this._tickingCommands
		const defaultConfig = this.getDefault()
		return defaultConfig.tickingCommands
	}
	set tickingCommands(value: NonNullable<CameraConfig['_tickingCommands']>) {
		this._tickingCommands = value
	}

	public toJSON(): IBlueprintCameraConfigJSON {
		return {
			entity_type: this.entityType,
			nbt: this.nbt,
			ticking_commands: this.tickingCommands,
		}
	}

	public static fromJSON(json: IBlueprintCameraConfigJSON): CameraConfig {
		const config = new CameraConfig()
		if (json.entity_type != undefined) config.entityType = json.entity_type
		if (json.nbt != undefined) config.nbt = json.nbt
		if (json.ticking_commands != undefined) config.tickingCommands = json.ticking_commands
		return config
	}

	public isDefault(): boolean {
		return this.checkIfEqual(new CameraConfig())
	}

	public checkIfEqual(other: CameraConfig) {
		return (
			this.entityType === other.entityType &&
			this.nbt === other.nbt &&
			this.tickingCommands === other.tickingCommands
		)
	}
}

export class TextDisplayConfig {
	private _billboard?: BillboardMode
	private _overrideBrightness?: boolean
	private _brightnessOverride?: number
	private _glowing?: boolean
	private _overrideGlowColor?: boolean
	private _glowColor?: string
	private _invisible?: boolean
	private _shadowRadius?: number
	private _shadowStrength?: number
	private _useNBT?: boolean
	private _nbt?: string

	static getDefault(): TextDisplayConfig {
		return TextDisplayConfig.fromJSON({
			billboard: 'fixed',
			override_brightness: false,
			brightness_override: 0,
			glowing: false,
			override_glow_color: false,
			glow_color: '#ffffff',
			invisible: false,
			nbt: '{}',
			shadow_radius: 0,
			shadow_strength: 1,
			use_nbt: false,
		})
	}

	get billboard(): NonNullable<BoneConfig['_billboard']> {
		if (this._billboard !== undefined) return this._billboard
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.billboard
	}
	set billboard(value: BoneConfig['_billboard']) {
		this._billboard = value
	}

	get overrideBrightness(): NonNullable<BoneConfig['_overrideBrightness']> {
		if (this._overrideBrightness !== undefined) return this._overrideBrightness
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.overrideBrightness
	}
	set overrideBrightness(value: BoneConfig['_overrideBrightness']) {
		this._overrideBrightness = value
	}

	get brightnessOverride(): NonNullable<BoneConfig['_brightnessOverride']> {
		if (this._brightnessOverride !== undefined) return this._brightnessOverride
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.brightnessOverride
	}
	set brightnessOverride(value: BoneConfig['_brightnessOverride']) {
		this._brightnessOverride = value
	}

	get glowing(): NonNullable<BoneConfig['_glowing']> {
		if (this._glowing !== undefined) return this._glowing
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.glowing
	}
	set glowing(value: BoneConfig['_glowing']) {
		this._glowing = value
	}

	get overrideGlowColor(): NonNullable<BoneConfig['_overrideGlowColor']> {
		if (this._overrideGlowColor !== undefined) return this._overrideGlowColor
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.overrideGlowColor
	}
	set overrideGlowColor(value: BoneConfig['_overrideGlowColor']) {
		this._overrideGlowColor = value
	}

	get glowColor(): NonNullable<BoneConfig['_glowColor']> {
		if (this._glowColor !== undefined) return this._glowColor
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.glowColor
	}
	set glowColor(value: BoneConfig['_glowColor']) {
		this._glowColor = value
	}

	get invisible(): NonNullable<BoneConfig['_invisible']> {
		if (this._invisible !== undefined) return this._invisible
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.invisible
	}
	set invisible(value: BoneConfig['_invisible']) {
		this._invisible = value
	}

	get nbt(): NonNullable<BoneConfig['_nbt']> {
		if (this._nbt !== undefined) return this._nbt
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.nbt
	}
	set nbt(value: BoneConfig['_nbt']) {
		this._nbt = value
	}

	get shadowRadius(): NonNullable<BoneConfig['_shadowRadius']> {
		if (this._shadowRadius !== undefined) return this._shadowRadius
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.shadowRadius
	}
	set shadowRadius(value: BoneConfig['_shadowRadius']) {
		this._shadowRadius = value
	}

	get shadowStrength(): NonNullable<BoneConfig['_shadowStrength']> {
		if (this._shadowStrength !== undefined) return this._shadowStrength
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.shadowStrength
	}
	set shadowStrength(value: BoneConfig['_shadowStrength']) {
		this._shadowStrength = value
	}

	get useNBT(): NonNullable<BoneConfig['_useNBT']> {
		if (this._useNBT !== undefined) return this._useNBT
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.useNBT
	}
	set useNBT(value: BoneConfig['_useNBT']) {
		this._useNBT = value
	}

	getDefault(): TextDisplayConfig {
		return TextDisplayConfig.fromJSON({
			billboard: 'center',
		})
	}

	get tickingCommands(): NonNullable<TextDisplayConfig['_billboard']> {
		if (this._billboard !== undefined) return this._billboard
		const defaultConfig = this.getDefault()
		return defaultConfig.tickingCommands
	}
	set tickingCommands(value: NonNullable<TextDisplayConfig['_billboard']>) {
		this._billboard = value
	}

	public toJSON(): IBlueprintTextDisplayConfigJSON {
		return {
			billboard: this._billboard,
			override_brightness: this._overrideBrightness,
			brightness_override: this._brightnessOverride,
			glowing: this._glowing,
			override_glow_color: this._overrideGlowColor,
			glow_color: this._glowColor,
			invisible: this._invisible,
			nbt: this._nbt,
			shadow_radius: this._shadowRadius,
			shadow_strength: this._shadowStrength,
			use_nbt: this._useNBT,
		}
	}

	public static fromJSON(json: IBlueprintTextDisplayConfigJSON): TextDisplayConfig {
		const config = new TextDisplayConfig()
		if (json.billboard !== undefined) config._billboard = json.billboard
		if (json.override_brightness !== undefined)
			config._overrideBrightness = json.override_brightness
		if (json.brightness_override !== undefined)
			config._brightnessOverride = json.brightness_override
		if (json.glowing !== undefined) config._glowing = json.glowing
		if (json.override_glow_color !== undefined)
			config._overrideGlowColor = json.override_glow_color
		if (json.glow_color !== undefined) config._glowColor = json.glow_color
		if (json.invisible !== undefined) config._invisible = json.invisible
		if (json.nbt !== undefined) config._nbt = json.nbt
		if (json.shadow_radius !== undefined) config._shadowRadius = json.shadow_radius
		if (json.shadow_strength !== undefined) config._shadowStrength = json.shadow_strength
		if (json.use_nbt !== undefined) config._useNBT = json.use_nbt

		return config
	}

	public toNBT(compound = new NbtCompound()) {
		if (this.useNBT) {
			const newData = NbtTag.fromString(this.nbt) as NbtCompound
			for (const key of newData.keys()) {
				compound.set(key, newData.get(key)!)
			}
			return compound
		}

		if (this._billboard) {
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

		if (this._shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this._shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}

	public isDefault(): boolean {
		return this.checkIfEqual(new TextDisplayConfig())
	}

	public checkIfEqual(other: TextDisplayConfig) {
		return (
			this._billboard === other._billboard &&
			this._overrideBrightness === other._overrideBrightness &&
			this._brightnessOverride === other._brightnessOverride &&
			this._glowing === other._glowing &&
			this._overrideGlowColor === other._overrideGlowColor &&
			this._glowColor === other._glowColor &&
			this._invisible === other._invisible &&
			this._nbt === other._nbt &&
			this._shadowRadius === other._shadowRadius &&
			this._shadowStrength === other._shadowStrength &&
			this._useNBT === other._useNBT
		)
	}
}
