import { SvelteDialogSidebar } from 'svelte-patching-tools/blockbench'
import { updateRotationConstraints } from '../../formats/blueprint'
import {
	EXPORT,
	EXPORT_DEBUG,
	OPEN_ABOUT,
	OPEN_DOCUMENTATION,
} from '../../interface/animatedJavaBarItem'
import { updateAllCubeOutlines } from '../../mods/cube'
import { createScopedTranslator } from '../../util/lang'
import FooterComponent from './footer.svelte'
import DatapackComponent from './pages/datapack.svelte'
import EventFunctionsComponent from './pages/eventFunctions.svelte'
import GeneralComponent from './pages/general.svelte'
import MiscComponent from './pages/misc.svelte'
import PluginComponent from './pages/plugin.svelte'
import ResourcepackComponent from './pages/resourcepack.svelte'

const localize = createScopedTranslator('dialog.blueprint_settings')

export function openBlueprintSettings() {
	const dialog = new SvelteDialogSidebar({
		id: `animated_java_blueprint_settings`,
		title: 'Blueprint Settings',
		pages: {
			general: {
				component: GeneralComponent,
				label: localize('pages.general.title'),
				icon: 'settings',
			},
			datapack: {
				component: DatapackComponent,
				condition: () => Project.pluginMode.get() === false,
				label: localize('pages.datapack.title'),
				icon: 'database',
			},
			resourcepack: {
				component: ResourcepackComponent,
				condition: () => Project.pluginMode.get() === false,
				label: localize('pages.resource_pack.title'),
				icon: 'image',
			},
			eventFunctions: {
				component: EventFunctionsComponent,
				condition: () => Project.pluginMode.get() === false,
				label: localize('pages.event_functions.title'),
				icon: 'functions',
			},
			plugin: {
				component: PluginComponent,
				condition: () => Project.pluginMode.get() === true,
				label: localize('pages.plugin.title'),
				icon: 'fa-paper-plane',
			},
			misc: {
				component: MiscComponent,
				label: localize('pages.misc.title'),
				icon: 'tune',
			},
		},
		footer: {
			component: FooterComponent,
		},
		pageSwitchActions: [
			OPEN_DOCUMENTATION.get()!,
			OPEN_ABOUT.get()!,
			EXPORT_DEBUG.get()!,
			EXPORT.get()!,
		],
		width: 1024,
		defaultPage: 'general',
		disableKeybinds: true,
		buttons: ['Close'],
		onClose: () => {
			updateRotationConstraints()
			updateAllCubeOutlines()
			Canvas.updateAll()
		},
	})
	dialog.show()
	return dialog
}
