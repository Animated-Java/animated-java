import { isCurrentFormat as condition } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { type ContextProperty, createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:boneProperties`,
	{
		inherit_settings: undefined as ContextProperty<'boolean'>,
		use_nbt: undefined as ContextProperty<'boolean'>,
		glowing: undefined as ContextProperty<'boolean'>,
		glow_color: undefined as ContextProperty<'string'>,
		shadow_radius: undefined as ContextProperty<'number'>,
		shadow_strength: undefined as ContextProperty<'number'>,
		brightness_override: undefined as ContextProperty<'number'>,
		enchanted: undefined as ContextProperty<'boolean'>,
		invisible: undefined as ContextProperty<'boolean'>,
		nbt: undefined as ContextProperty<'string'>,
	},
	// prettier-ignore
	context => {
		context.inherit_settings = new Property(Group, 'boolean', 'inherit_settings', { default: true, condition })
		context.use_nbt = new Property(Group, 'boolean', 'use_nbt', { default: false, condition })
		context.glowing = new Property(Group, 'boolean', 'glowing', { default: false, condition })
		context.glow_color = new Property(Group, 'string', 'glow_color', { default: '#ffffff', condition })
		context.shadow_radius = new Property(Group, 'number', 'shadow_radius', { default: 0, condition })
		context.shadow_strength = new Property(Group, 'number', 'shadow_strength', { default: 0, condition })
		context.brightness_override = new Property(Group, 'number', 'brightness_override', { default: 0, condition })
		context.enchanted = new Property(Group, 'boolean', 'enchanted', { default: false, condition })
		context.invisible = new Property(Group, 'boolean', 'invisible', { default: false, condition })
		context.nbt = new Property(Group, 'string', 'nbt', { default: '{}', condition })
		return context
	},
	context => {
		context.inherit_settings?.delete()
		context.use_nbt?.delete()
		context.glowing?.delete()
		context.glow_color?.delete()
		context.shadow_radius?.delete()
		context.shadow_strength?.delete()
		context.brightness_override?.delete()
		context.enchanted?.delete()
		context.invisible?.delete()
		context.nbt?.delete()
	}
)
