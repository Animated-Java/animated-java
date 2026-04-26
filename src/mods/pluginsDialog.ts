import { registerPatch } from 'blockbench-patch-manager'
import { observable } from 'svelte-observable-store'
import { injectComponent } from 'svelte-patching-tools'
import IncompatiblePluginNotice from '../svelteComponents/incompatiblePluginNotice.svelte'

const SELECTED_PLUGIN = observable<BBPlugin | null>(null)

registerPatch({
	id: `animated_java:plugins-dialog-mod`,

	apply: () => {
		const original = Plugins.dialog!.component.methods.selectPlugin

		Plugins.dialog!.component.methods.selectPlugin = function (this, plugin: BBPlugin) {
			const result = original.call(this, plugin)
			SELECTED_PLUGIN.set(plugin)
			return result
		}

		return { original }
	},

	revert: ({ original }) => {
		Plugins.dialog!.component.methods.selectPlugin = original
	},
})

let unmountCallback: (() => Promise<void>) | null

SELECTED_PLUGIN.subscribe(async plugin => {
	await unmountCallback?.()
	unmountCallback = null
	if (!plugin) return

	requestAnimationFrame(() => {
		unmountCallback = injectComponent({
			component: IncompatiblePluginNotice,
			props: { selectedPlugin: plugin },
			elementSelector: (): HTMLElement | null => {
				return document.querySelector('.plugin_browser_page_header')
			},
			prepend: true,
		})
	})
})
