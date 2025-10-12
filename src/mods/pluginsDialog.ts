import { registerMod } from 'src/util/moddingTools'
import { mountSvelteComponent } from 'src/util/mountSvelteComponent'
import IncompatiblePluginNotice from '../components/incompatiblePluginNotice.svelte'
import { Valuable } from '../util/stores'

const SELECTED_PLUGIN = new Valuable<BBPlugin | null>(null)

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

let mounted: IncompatiblePluginNotice | null = null

SELECTED_PLUGIN.subscribe(plugin => {
	if (mounted) {
		mounted.$destroy()
		mounted = null
	}
	if (!plugin) return

	requestAnimationFrame(() => {
		mounted = mountSvelteComponent({
			component: IncompatiblePluginNotice,
			props: { selectedPlugin: plugin },
			target: '.plugin_browser_page_header',
			prepend: true,
			onDestroy: () => {
				mounted = null
			},
		})
	})
})
