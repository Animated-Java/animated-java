import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint'
import { TextDisplay } from '../../outliner/textDisplay'
import { VanillaBlockDisplay } from '../../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../../outliner/vanillaItemDisplay'
import { type IDisplayEntityConfigs } from '../../systems/rigRenderer'
import { localize as translate } from '../../util/lang'
import DisplayEntityConfigDialog from './displayEntityConfig.svelte'

export type DisplayEntity = Group | TextDisplay | VanillaItemDisplay | VanillaBlockDisplay

function isDisplayEntity(object: any): object is DisplayEntity {
	return (
		object instanceof Group ||
		object instanceof TextDisplay ||
		object instanceof VanillaItemDisplay ||
		object instanceof VanillaBlockDisplay
	)
}

export function openDisplayEntityConfigDialog(displayEntity: DisplayEntity) {
	const onSummonFunction = observable<string>(displayEntity.onSummonFunction ?? '')
	const configs = structuredClone(displayEntity.configs)

	new SvelteDialog({
		id: `animated_java:displayEntityConfig`,
		title: translate('dialog.display_entity.title', displayEntity.name),
		width: 800,
		component: DisplayEntityConfigDialog,
		props: {
			displayEntity,
			onSummonFunction,
			configs,
		},
		disableKeybinds: true,
		onConfirm() {
			console.log('Saving display entity config for', displayEntity.name, configs)

			displayEntity.onSummonFunction = onSummonFunction.get().trim()
			displayEntity.configs = configs

			Project!.saved = false
		},
	}).show()
}

let clipboard: {
	sourceName: string
	onSummonFunction: string
	configs: IDisplayEntityConfigs
} | null = null

const COPY_DISPLAY_ENTITY_CONFIG_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/copy-display-entity-config`,
	create() {
		return new Blockbench.Action(`animated_java:action/copy-display-entity-config`, {
			icon: 'content_copy',
			name: translate('action.copy_display_entity_config.name'),
			click: () => {
				const displayEntity = Group.first_selected ?? selected.at(0)
				if (isDisplayEntity(displayEntity)) {
					clipboard = {
						sourceName: displayEntity.name,
						onSummonFunction: displayEntity.onSummonFunction ?? '',
						configs: structuredClone(displayEntity.configs),
					}
					Blockbench.showQuickMessage(
						translate('action.copy_display_entity_config.message', clipboard.sourceName)
					)
				} else {
					console.error(
						'Attempted to copy display entity config with no display entity selected'
					)
				}
			},
		})
	},
})

const PASTE_DISPLAY_ENTITY_CONFIG_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/paste-display-entity-config`,
	create() {
		return new Blockbench.Action(`animated_java:action/paste-display-entity-config`, {
			icon: 'content_paste',
			name: translate('action.paste_display_entity_config.name'),
			condition: () => !!clipboard && activeProjectIsBlueprintFormat(),
			click: () => {
				if (!clipboard) return
				const displayEntity = Group.first_selected ?? selected.at(0)
				if (isDisplayEntity(displayEntity)) {
					if (displayEntity instanceof Group) {
						Undo.initEdit({ group: displayEntity })
					} else {
						Undo.initEdit({ elements: [displayEntity] })
					}
					displayEntity.onSummonFunction = clipboard.onSummonFunction
					displayEntity.configs = structuredClone(clipboard.configs)
					const message = translate(
						'action.paste_display_entity_config.message',
						clipboard.sourceName
					)
					if (displayEntity instanceof Group) {
						Undo.finishEdit(message, { group: displayEntity })
					} else {
						Undo.finishEdit(message, { elements: [displayEntity] })
					}
					Blockbench.showQuickMessage(message)
				} else {
					console.error(
						'Attempted to paste display entity config with no display entity selected'
					)
				}
			},
		})
	},
})

export const DISPLAY_ENTITY_CONFIG_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/open-display-entity-config`,
	dependencies: [
		'animated_java:action/copy-display-entity-config',
		'animated_java:action/paste-display-entity-config',
	],
	create() {
		const action = new Blockbench.Action(`animated_java:action/open-display-entity-config`, {
			icon: 'settings',
			name: translate('action.open_display_entity_config.name'),
			condition: activeProjectIsBlueprintFormat,
			click: () => {
				const displayEntity = Group.first_selected ?? selected.at(0)
				if (isDisplayEntity(displayEntity)) {
					openDisplayEntityConfigDialog(displayEntity)
				} else {
					console.error(
						'Attempted to open display entity config dialog with no display entity selected'
					)
				}
			},
		})

		const copyAction = COPY_DISPLAY_ENTITY_CONFIG_ACTION.get()
		if (!copyAction) {
			console.error('Copy display entity config action not registered')
			return
		}
		const pasteAction = PASTE_DISPLAY_ENTITY_CONFIG_ACTION.get()
		if (!pasteAction) {
			console.error('Paste display entity config action not registered')
			return
		}

		Group.prototype.menu!.structure.splice(6, 0, '_')
		Group.prototype.menu!.addAction(action, 7)
		Group.prototype.menu!.addAction(copyAction, 8)
		Group.prototype.menu!.addAction(pasteAction, 9)

		const displayEntityMenu = new Menu([
			...Outliner.control_menu_group,
			'_',
			action,
			copyAction,
			pasteAction,
			'_',
			'rename',
			'delete',
		])

		TextDisplay.prototype.menu = displayEntityMenu
		VanillaItemDisplay.prototype.menu = displayEntityMenu
		VanillaBlockDisplay.prototype.menu = displayEntityMenu

		return action
	},
})
