import { BlueprintSettings } from '@aj/formats/ajblueprint/settings'
import { SvelteDialogSidebar } from '@aj/svelte/dialog'
import { formatFaIcon } from '@aj/util/iconUtils'
import { translate } from '@aj/util/lang'
import { resolveSyncableValues, syncable } from '@aj/util/stores'
import Footer from './footer.svelte'
import DataPackPage from './pages/dataPack.svelte'
import GeneralPage from './pages/general.svelte'
import ResourcePackPage from './pages/resourcePack.svelte'
import Title from './title.svelte'

export function openBlueprintSettings() {
	const blueprintSettings = new BlueprintSettings()
	console.log('Opening Blueprint Settings', blueprintSettings)

	const generalSettings = {
		exportEnvironment: syncable(blueprintSettings.exportEnvironment),
		targetMinecraftVersion: syncable(blueprintSettings.targetMinecraftVersion),
		id: syncable(blueprintSettings.id),
		tagPrefix: syncable(blueprintSettings.tagPrefix),
		autoGenerateTagPrefix: syncable(blueprintSettings.autoGenerateTagPrefix),
		showRenderBox: syncable(blueprintSettings.showRenderBox),
		autoRenderBox: syncable(blueprintSettings.autoRenderBox),
		renderBoxWidth: syncable(blueprintSettings.renderBoxWidth),
		renderBoxHeight: syncable(blueprintSettings.renderBoxHeight),
	}

	function onClose() {
		const newSettings = {
			...resolveSyncableValues(generalSettings),
		}
		console.log(
			'Blueprint Settings closed',
			newSettings,
			new BlueprintSettings().fromJSON(newSettings)
		)
	}

	new SvelteDialogSidebar({
		title: {
			component: Title,
			props: {},
		},
		id: 'animated-java:blueprint-settings',
		pages: {
			general: {
				label: translate('dialog.blueprint-settings.pages.general.label'),
				icon: formatFaIcon('fa:cog'),
				component: GeneralPage,
				props: {
					generalSettings,
				},
			},
			'data-pack': {
				label: translate('dialog.blueprint-settings.pages.data-pack.label'),
				icon: formatFaIcon('fa:database'),
				component: DataPackPage,
				props: {},
			},
			'resource-pack': {
				label: translate('dialog.blueprint-settings.pages.resource-pack.label'),
				icon: formatFaIcon('fa:image'),
				component: ResourcePackPage,
				props: {},
			},
		},
		pageSwitchActions: [],
		footer: {
			component: Footer,
		},
		stackable: true,
		onOpen: () => console.log('Dialog opened'),
		onButton: index => console.log('Button clicked', index),
		onFormChange: data => console.log('Form changed', data),
		onConfirm: () => console.log('Dialog confirmed'),
		onCancel: () => console.log('Dialog canceled'),
		onClose,
	}).show()
}
