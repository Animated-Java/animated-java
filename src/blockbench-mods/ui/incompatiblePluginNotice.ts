import IncompatiblePluginNotice from '@svelte-components/incompatiblePluginNotice.svelte'
import { PACKAGE } from '../../constants'
import { injectSvelteCompomponentMod } from '../../util/injectSvelteComponent'
import { createBlockbenchMod } from '../../util/moddingTools'
import { Valuable } from '../../util/stores'

const SELECTED_PLUGIN = new Valuable<BBPlugin | null>(null)

injectSvelteCompomponentMod({
	component: IncompatiblePluginNotice,
	props: {
		selectedPlugin: SELECTED_PLUGIN,
	},
	elementSelector() {
		return document.querySelector('.plugin_browser_page_header')
	},
})

createBlockbenchMod(
	`${PACKAGE.name}:mods/ui/incompatiblePluginNotice`,
	{
		// @ts-expect-error - Vue components default to having no methods
		originalSelect: Plugins.dialog.component.methods.selectPlugin,
	},
	context => {
		// @ts-expect-error
		Plugins.dialog.component.methods.selectPlugin = function (this, plugin: BBPlugin) {
			const result = context.originalSelect.call(this, plugin)
			SELECTED_PLUGIN.set(plugin)
			return result
		}

		return context
	},
	context => {
		// @ts-expect-error
		Plugins.dialog.component.methods.selectPlugin = context.originalSelect
	}
)
