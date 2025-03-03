import type { Alignment } from '@aj/blockbench-additions/outliner-elements/textDisplay'
import { translate } from '@aj/util/translation'
import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtString } from 'deepslate/lib/nbt'
import { SerializableConfig } from './serializableConfig'
export type { Serialized } from './serializableConfig'

@SerializableConfig.decorate
export class CommonDisplayConfig extends SerializableConfig<CommonDisplayConfig> {
	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.billboard')
		},
		displayMode: 'select',
		options: ['fixed', 'vertical', 'horizontal', 'center'],
	})
	billboard?: BillboardMode = 'fixed'

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.overrideBrightness')
		},
		displayMode: 'checkbox',
	})
	overrideBrightness? = false

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.brightness')
		},
		displayMode: 'slider',
		min: 0,
		max: 15,
		step: 1,
	})
	brightness? = 0

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.glowing')
		},
		displayMode: 'checkbox',
	})
	glowing? = false

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.overrideGlowColor')
		},
		displayMode: 'checkbox',
	})
	overrideGlowColor? = false

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.glowColor')
		},
		displayMode: 'color',
	})
	glowColor? = '#ffffff'

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.invisible')
		},
		displayMode: 'checkbox',
	})
	invisible? = false

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.shadowRadius')
		},
		displayMode: 'number',
		min: 0,
		max: 64,
		step: 0.1,
	})
	shadowRadius? = 0

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.shadowStrength')
		},
		displayMode: 'number',
		min: 0,
		max: 1,
		step: 0.1,
	})
	shadowStrength? = 1

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.common.options.onSummonCommands')
		},
		displayMode: 'code_editor',
		syntax: 'mc-build',
	})
	onSummonCommands? = ''

	public toNBT(compound: NbtCompound = new NbtCompound()): NbtCompound {
		if (this.billboard) {
			compound.set('billboard', new NbtString(this.billboard))
		}

		if (this.overrideBrightness && this.brightness != undefined) {
			compound.set(
				'brightness',
				new NbtCompound()
					.set('block', new NbtFloat(this.brightness))
					.set('sky', new NbtFloat(this.brightness))
			)
		}

		if (this.glowing) {
			compound.set('Glowing', new NbtByte(Number(this.glowing)))
		}
		if (this.overrideGlowColor && this.glowColor != undefined) {
			compound.set(
				'glow_color_override',
				new NbtInt(Number(this.glowColor.replace('#', '0x')))
			)
		}

		// TODO Figure out a good solution for toggling a bone's visibility...
		// if (force || config.invisible !== defaultConfig.invisible) {
		// 	compound.set('invisible', new NbtByte(1))
		// }

		if (this.shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this.shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}
}

@SerializableConfig.decorate
export class BoneConfig extends SerializableConfig<BoneConfig> {
	customName? = ''
	customNameVisible? = false
	enchanted? = false

	public toNBT(compound: NbtCompound = new NbtCompound()): NbtCompound {
		if (this.customName) {
			compound.set('CustomName', new NbtString(this.customName))
		}

		if (this.customNameVisible) {
			compound.set('CustomNameVisible', new NbtByte(Number(this.customNameVisible)))
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

		return compound
	}
}

@SerializableConfig.decorate
export class LocatorConfig extends SerializableConfig<LocatorConfig> {
	useEntity?: boolean
	entityType?: string
	syncPassengerRotation?: boolean
	summonCommands?: string
	tickingCommands?: string
}

@SerializableConfig.decorate
export class CameraConfig extends SerializableConfig<CameraConfig> {
	entityType?: string
	nbt?: string
	tickingCommands?: string
}

@SerializableConfig.decorate
export class ItemDisplayConfig extends SerializableConfig<ItemDisplayConfig> {}

@SerializableConfig.decorate
export class BlockDisplayConfig extends SerializableConfig<BlockDisplayConfig> {}

@SerializableConfig.decorate
export class TextDisplayConfig extends SerializableConfig<TextDisplayConfig> {
	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.animated_java:text_display.options.alignment')
		},
		displayMode: 'select',
		options: ['center', 'left', 'right'],
	})
	alignment?: Alignment = 'center'

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.animated_java:text_display.options.backgroundColor')
		},
		displayMode: 'color',
	})
	backgroundColor = '#0000003f'

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.animated_java:text_display.options.lineWidth')
		},
		displayMode: 'color',
	})
	lineWidth? = 200

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.animated_java:text_display.options.seeThrough')
		},
		displayMode: 'checkbox',
	})
	seeThrough? = false

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.animated_java:text_display.options.shadow')
		},
		displayMode: 'checkbox',
	})
	shadow? = false

	@SerializableConfig.configurePropertyDisplay({
		get displayName() {
			return translate('config.animated_java:text_display.options.textComponent')
		},
		displayMode: 'code_editor',
		syntax: 'json',
	})
	textComponent? = ''

	public toNBT(compound = new NbtCompound()) {
		console.error('toNBT not implemented for TextDisplayConfig!')
		return compound
	}
}
