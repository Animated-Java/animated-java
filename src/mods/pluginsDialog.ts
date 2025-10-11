import { registerMod } from 'src/util/moddingTools'
import { registerMountSvelteComponentMod } from 'src/util/mountSvelteComponent'
import IncompatiblePluginNotice from '../components/incompatiblePluginNotice.svelte'
import { Valuable } from '../util/stores'

const SELECTED_PLUGIN = new Valuable<BBPlugin | null>(null)

registerMountSvelteComponentMod({
	id: 'animated-java:dialog/incompatible-plugin-notice',
	component: IncompatiblePluginNotice,
	target: '.plugin_browser_page_header',
	prepend: true,
	props: {
		selectedPlugin: SELECTED_PLUGIN,
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
