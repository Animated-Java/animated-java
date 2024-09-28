import { PACKAGE } from '../constants'
import { SvelteSidebarDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'
import { updateBoundingBox } from '../blueprintFormat'
import General from '../components/blueprintSettingsPages/general.svelte'
import Datapack from '../components/blueprintSettingsPages/datapack.svelte'
import { defaultValues } from '../blueprintSettings'
import RequiredAsteriskInform from '../components/sidebarDialogItems/requiredAsteriskInform.svelte'
import Resourcepack from '../components/blueprintSettingsPages/resourcepack.svelte'
import { makeNotValueable, makeValuable } from '../util/misc'
import { Valuable } from '../util/stores'
import Plugin from '../components/blueprintSettingsPages/plugin.svelte'

export type BlueprintSettings = typeof defaultValues & { project_name: string }
export type ValuableBlueprintSettings = {
	[Key in keyof BlueprintSettings]: Valuable<BlueprintSettings[Key]>
}

export function openBlueprintSettingsDialog() {
	if (!Project) return

	const settings: ValuableBlueprintSettings = makeValuable({
		...defaultValues,
		project_name: Project.name,
	})

	return new SvelteSidebarDialog({
		id: `${PACKAGE.name}:blueprintSettingsDialog`,
		title: translate('dialog.blueprint_settings.title'),
		sidebar: {
			pages: {
				general: {
					icon: 'settings',
					label: 'General',
					component: General,
					props: { settings },
				},
				datapack: {
					icon: 'folder',
					label: 'Data Pack',
					component: Datapack,
					props: { settings },
					condition() {
						return settings.environment.get() === 'vanilla'
					},
				},
				resourcepack: {
					icon: 'folder',
					label: 'Resource Pack',
					component: Resourcepack,
					props: { settings },
					condition() {
						return settings.environment.get() === 'vanilla'
					},
				},
				plugin: {
					icon: 'power',
					label: 'Plugin',
					component: Plugin,
					props: { settings },
					condition() {
						return settings.environment.get() === 'plugin'
					},
				},
			},
		},
		width: 1024,
		preventKeybinds: true,
		onOpen() {
			const buttonBar = $(
				"dialog[id='animated_java:blueprintSettingsDialog'] .dialog_bar.button_bar"
			).first()
			const anchor = document.createComment('asterisk-mount') as unknown as HTMLElement
			buttonBar.prepend(anchor)
			new RequiredAsteriskInform({
				target: buttonBar[0],
				anchor,
			})
			const dialogContent = $(
				'.dialog[id="animated_java:blueprintSettingsDialog"] .dialog_content'
			)[0]
			if (dialogContent) {
				dialogContent.style.overflowY = 'auto'
				dialogContent.style.maxHeight = '80vh'
			}
		},
		onConfirm() {
			console.log(makeNotValueable(settings))
			updateBoundingBox()
		},
	}).show()
}
