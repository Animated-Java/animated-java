import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

function condition() {
	return Format.id === BLUEPRINT_FORMAT.id
}

createBlockbenchMod(
	`${PACKAGE.name}:boneProperties`,
	{
		inherit_settings: undefined as Property<'boolean'> | undefined,
		use_nbt: undefined as Property<'boolean'> | undefined,
		glowing: undefined as Property<'boolean'> | undefined,
		glow_color: undefined as Property<'string'> | undefined,
		shadow_radius: undefined as Property<'number'> | undefined,
		shadow_strength: undefined as Property<'number'> | undefined,
		brightness_override: undefined as Property<'number'> | undefined,
		enchanted: undefined as Property<'boolean'> | undefined,
		invisible: undefined as Property<'boolean'> | undefined,
		nbt: undefined as Property<'string'> | undefined,
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
