import { registerMod } from 'src/util/moddingTools'
import IncompatiblePluginNotice from '../components/incompatiblePluginNotice.svelte'
import { injectSvelteComponentMod } from '../util/injectSvelteComponent'
import { Valuable } from '../util/stores'

const SELECTED_PLUGIN = new Valuable<BBPlugin | null>(null)

injectSvelteComponentMod({
	component: IncompatiblePluginNotice,
	props: {
		selectedPlugin: SELECTED_PLUGIN,
	},
	elementSelector() {
		return document.querySelector('.plugin_browser_page_header')
	},
})

registerMod({
	id: `animated-java:plugins-dialog-mod`,

	apply: () => {
		// @ts-expect-error Missing types
		const original = Plugins.dialog.component.methods.selectPlugin

		// @ts-expect-error Missing types
		Plugins.dialog.component.methods.selectPlugin = function (this, plugin: BBPlugin) {
			const result = original.call(this, plugin)
			SELECTED_PLUGIN.set(plugin)
			return result
		}

		return { original }
	},

	revert: ({ original }) => {
		// @ts-expect-error Missing types
		Plugins.dialog.component.methods.selectPlugin = original
	},
})
