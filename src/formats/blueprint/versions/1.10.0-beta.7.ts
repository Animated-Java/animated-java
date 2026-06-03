import type { IBlueprintFormatJSON } from '..'

export default function upgrade(model: any): IBlueprintFormatJSON {
	console.log('Processing model format 1.10.0-beta.7', JSON.parse(JSON.stringify(model)))
	const fixed: IBlueprintFormatJSON = JSON.parse(JSON.stringify(model))

	// Split brightness override into separate sky and block brightness values.
	for (const group of fixed.groups ?? []) {
		if (group.configs?.default) upgradeConfig(group.configs?.default)
		for (const config of Object.values(group.configs?.variants ?? {}) as any) {
			upgradeConfig(config)
		}
	}
	for (const element of fixed.elements ?? []) {
		if (element.configs?.default) upgradeConfig(element.configs?.default)
		for (const config of Object.values(element.configs?.variants ?? {}) as any) {
			upgradeConfig(config)
		}
	}

	return fixed
}

function upgradeConfig(config: any) {
	if (config?.brightness_override !== undefined) {
		config.sky_brightness ??= config.brightness_override
		config.block_brightness ??= config.brightness_override
		delete config.brightness_override
	}
}
