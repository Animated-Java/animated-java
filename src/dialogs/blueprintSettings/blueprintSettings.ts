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
import Footer from './footer.svelte'
import Datapack from './pages/datapack.svelte'
import EventFunctions from './pages/eventFunctions.svelte'
import General from './pages/general.svelte'
import Misc from './pages/misc.svelte'
import Resourcepack from './pages/resourcepack.svelte'

const localize = createScopedTranslator('dialog.blueprint_settings')

export function openBlueprintSettings() {
	const dialog = new SvelteDialogSidebar({
		id: `animated_java_blueprint_settings`,
		title: 'Blueprint Settings',
		pages: {
			general: {
				component: General,
				label: localize('pages.general.title'),
				icon: 'settings',
			},
			datapack: {
				component: Datapack,
				condition: () => Project.pluginMode.get() === false,
				label: localize('pages.datapack.title'),
				icon: 'database',
			},
			resourcepack: {
				component: Resourcepack,
				condition: () => Project.pluginMode.get() === false,
				label: localize('pages.resource_pack.title'),
				icon: 'image',
			},
			eventFunctions: {
				component: EventFunctions,
				condition: () => Project.pluginMode.get() === false,
				label: localize('pages.event_functions.title'),
				icon: 'functions',
			},
			misc: {
				component: Misc,
				label: localize('pages.misc.title'),
				icon: 'tune',
			},
		},
		footer: {
			component: Footer,
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
