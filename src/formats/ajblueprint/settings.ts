import { JsonConfig } from '@aj/util/jsonConfig'

export type ExportEnvironment = 'vanilla' | 'plugin'
export type ExportMode = 'folder' | 'zip' | 'none'
export type AnimationSystem = 'functions' | 'storage'

export type MinecraftVersion = '1.20.4' | '1.20.5' | '1.21.0' | '1.21.2' | '1.21.4' | '1.21.5'

@JsonConfig.decorate
export class BlueprintSettings extends JsonConfig<BlueprintSettings> {
	// General
	exportEnvironment: ExportEnvironment = 'vanilla'
	targetMinecraftVersion: MinecraftVersion = '1.21.5'
	id = 'animated_java:my_blueprint'
	tagPrefix = 'aj.my_blueprint'
	autoGenerateTagPrefix = true
	showRenderBox = false
	autoRenderBox = true
	renderBoxWidth = 48
	renderBoxHeight = 48
	// Resource Pack
	resourcePackExportMode: ExportMode = 'folder'
	resourcePackExportPath?: string
	// Data Pack
	dataPackExportMode: ExportMode = 'folder'
	dataPackExportPath?: string
	onSummonCommands?: string
	onRemoveCommands?: string
	onTickCommands?: string
	interpolationDuration = 1
	teleportationDuration = 1
	animationSystem: AnimationSystem = 'functions'
	showFunctionErrors = true
	showOutdatedWarnings = true
	// Plugin
	pluginJsonExportPath?: string
	bakeAnimations = false
}
