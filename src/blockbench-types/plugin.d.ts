interface PluginOptions {
	title: string
	author: string
	/**
	 * Description text in the plugin browser
	 */
	description: string
	/**
	 * The about text appears when the user unfolds the plugin in the plugin browser. It can contain additional information and usage instructions
	 */
	about?: string
	icon: string
	/**
	 * Plugin tags that will show up in the plugin store. You can provide up to 3 tags.
	 */
	tags?: [string, string?, string?]
	/**
	 * Where the plugin can be installed. Desktop refers to the electron app, web refers to the web app and PWA
	 */
	variant: 'both' | 'desktop' | 'web'
	/**
	 * The version of the plugin
	 */
	version: string
	/**
	 * Minimum Blockbench version in which the plugin can be installed
	 */
	min_version?: string
	/**
	 * Maximum Blockbench version in which the plugin can be installed
	 */
	max_version?: string
	/**
	 * Set to true if the plugin must finish loading before a project is opened, i. e. because it adds a format
	 */
	await_loading?: boolean
	format?: ModelFormat
	/**
	 * Runs when the plugin loads
	 */
	onload?(): void
	/**
	 * Runs when the plugin unloads
	 */
	onunload?(): void
	/**
	 * Runs when the user manually installs the plugin
	 */
	oninstall?(): void
	/**
	 * Runs when the user manually uninstalls the plugin
	 */
	onuninstall?(): void
}
declare class BBPlugin {
	constructor(id: string, options: PluginOptions)

	extend(options: PluginOptions): this

	installed: boolean
	expanded: boolean
	title: string
	author: string
	/**
	 * Description text in the plugin browser
	 */
	description: string
	/**
	 * The about text appears when the user unfolds the plugin in the plugin browser. It can contain additional information and usage instructions
	 */
	about: string
	icon: string
	variant: 'both' | 'desktop' | 'web'
	min_version: string
	max_version: string
	tags: string[]
	format?: ModelFormat
	onload(): void
	onunload(): void
	oninstall(): void
	onuninstall(): void

	static register(id: string, options: PluginOptions): BBPlugin
}
