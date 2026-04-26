import { type IBlueprintFormatJSON, getDefaultProjectSettings } from '..'
import { TextDisplay } from '../../../outliner/textDisplay'

export default function upgrade(model: any) {
	console.log('Processing model format 1.8.0', JSON.parse(JSON.stringify(model)))
	const fixed: IBlueprintFormatJSON = JSON.parse(JSON.stringify(model))

	fixed.blueprint_settings ??= {}

	// Update export mode settings
	if (model.blueprint_settings?.resource_pack_export_mode === 'raw') {
		fixed.blueprint_settings.resource_pack_export_mode = 'folder'
	}
	if (model.blueprint_settings?.data_pack_export_mode === 'raw') {
		fixed.blueprint_settings.data_pack_export_mode = 'folder'
	}

	// Update bounding box settings
	if (model.blueprint_settings?.show_bounding_box != undefined) {
		fixed.blueprint_settings.show_render_box = model.blueprint_settings.show_bounding_box
		// @ts-expect-error Does not exist on type
		delete fixed.blueprint_settings.show_bounding_box
	}
	if (model.blueprint_settings?.auto_bounding_box != undefined) {
		fixed.blueprint_settings.auto_render_box = model.blueprint_settings.auto_bounding_box
		// @ts-expect-error Does not exist on type
		delete fixed.blueprint_settings.auto_bounding_box
	}
	if (model.blueprint_settings?.bounding_box != undefined) {
		fixed.blueprint_settings.render_box = model.blueprint_settings.bounding_box
		// @ts-expect-error Does not exist on type
		delete fixed.blueprint_settings.bounding_box
	}

	// Update command settings
	if (model.blueprint_settings?.summon_commands != undefined) {
		fixed.blueprint_settings.on_summon_function = model.blueprint_settings.summon_commands
		// @ts-expect-error Does not exist on type
		delete fixed.blueprint_settings.summon_commands
	}
	if (model.blueprint_settings?.remove_commands != undefined) {
		fixed.blueprint_settings.on_remove_function = model.blueprint_settings.remove_commands
		// @ts-expect-error Does not exist on type
		delete fixed.blueprint_settings.remove_commands
	}
	if (model.blueprint_settings?.ticking_commands != undefined) {
		fixed.blueprint_settings.on_post_tick_function = model.blueprint_settings.ticking_commands
		// @ts-expect-error Does not exist on type
		delete fixed.blueprint_settings.ticking_commands
	}

	// Update target version settings
	if (Array.isArray(model.blueprint_settings?.target_minecraft_versions)) {
		fixed.blueprint_settings.target_minecraft_version =
			model.blueprint_settings.target_minecraft_versions.at(0) ??
			getDefaultProjectSettings().target_minecraft_version
		// @ts-expect-error Does not exist on type
		delete fixed.blueprint_settings.target_minecraft_versions
	}

	if (Array.isArray(fixed.elements)) {
		// Update text display backgrounds to use 8 digit hex colors instead of separate alpha
		const textDisplays = fixed.elements.filter(e => e.type === TextDisplay.type)
		for (const display of textDisplays) {
			if (display.backgroundAlpha !== undefined) {
				display.backgroundColor ??= TextDisplay.properties.backgroundColor.default as string
				display.backgroundColor = tinycolor(display.backgroundColor)
					.setAlpha(display.backgroundAlpha)
					.toHex8String()
				delete display.backgroundAlpha
			}
		}
		// Update old config structure for display entities
		const displayEntities = fixed.elements.filter(
			e =>
				e.type === AnimatedJava.TextDisplay.type ||
				e.type === AnimatedJava.VanillaItemDisplay.type ||
				e.type === AnimatedJava.VanillaBlockDisplay.type
		)
		for (const displayEntity of displayEntities) {
			if (displayEntity.config) {
				if (displayEntity.config.custom_name !== undefined) {
					displayEntity.config.on_apply_function ??= ''
					displayEntity.config.on_apply_function += `\n# Auto-upgraded custom name setting (May need fixing):\ndata modify entity @s CustomName set value '${displayEntity.config.custom_name}'\n`
					delete displayEntity.config.custom_name
				}
				if (displayEntity.config.custom_name_visible) {
					displayEntity.config.on_apply_function ??= ''
					displayEntity.config.on_apply_function += `\n# Auto-upgraded custom name visibility setting:\ndata modify entity @s CustomNameVisible set value ${displayEntity.config.custom_name_visible}\n`
					delete displayEntity.config.custom_name_visible
				}

				displayEntity.configs = {
					default: displayEntity.config,
					variants: {},
				}
				delete displayEntity.config
			}
		}
		// Update locators to use new event function names
		const locators = fixed.elements.filter(e => e.type === Locator.prototype.type)
		for (const locator of locators) {
			if (locator.config?.summon_commands) {
				locator.config.on_summon_function = locator.config.summon_commands
				delete locator.config.summon_commands
			}
			if (locator.config?.ticking_commands) {
				locator.config.on_tick_function = locator.config.ticking_commands
				delete locator.config.ticking_commands
			}
		}
	}

	// Update commands keyframes to use new keyframe channel name
	if (Array.isArray(fixed.animations)) {
		for (const animation of fixed.animations) {
			for (const animator of Object.values<any>(animation.animators ?? {})) {
				if (!Array.isArray(animator.keyframes)) continue
				for (const keyframe of animator.keyframes) {
					if (keyframe.channel !== 'commands') continue
					keyframe.channel = 'function'
					if (Array.isArray(keyframe.data_points)) {
						for (const dataPoint of keyframe.data_points) {
							if (dataPoint.commands) {
								dataPoint.function = dataPoint.commands
								delete dataPoint.commands
							}
						}
					}
				}
			}
		}
	}

	return fixed
}
