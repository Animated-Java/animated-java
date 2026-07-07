import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { SvelteDialogSidebar } from 'svelte-patching-tools/blockbench'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint'
import { TextDisplay } from '../../outliner/textDisplay'
import { VanillaBlockDisplay } from '../../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../../outliner/vanillaItemDisplay'
import { type IDisplayEntityConfigs } from '../../systems/rigRenderer'
import { localize } from '../../util/lang'
import GeneralPage from './pages/general.svelte'
import PerVariantPage from './pages/perVariant.svelte'

export type DisplayEntity = Group | TextDisplay | VanillaItemDisplay | VanillaBlockDisplay

function isDisplayEntity(object: any): object is DisplayEntity {
	return (
		(object instanceof Group && object.children.some(child => child instanceof Cube)) ||
		object instanceof TextDisplay ||
		object instanceof VanillaItemDisplay ||
		object instanceof VanillaBlockDisplay
	)
}

export function openDisplayEntityConfigDialog(displayEntity: DisplayEntity) {
	new SvelteDialogSidebar({
		id: `animated_java:displayEntityConfig`,
		title: localize('dialog.display_entity.title', displayEntity.name),
		width: 1024,
		pages: {
			general: {
				label: localize('dialog.display_entity.pages.general.title'),
				icon: 'settings',
				component: GeneralPage,
				props: { displayEntity },
			},
			per_variant: {
				label: localize('dialog.display_entity.pages.per_variant.title'),
				icon: 'view_list',
				component: PerVariantPage,
				props: { displayEntity },
			},
		},
		buttons: [tl('dialog.close')],
		disableKeybinds: true,
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
			name: localize('action.copy_display_entity_config.name'),
			condition: () =>
				activeProjectIsBlueprintFormat() &&
				isDisplayEntity(Group.first_selected ?? Outliner.selected.at(0)),
			click: () => {
				const displayEntity = Group.first_selected ?? Outliner.selected.at(0)
				if (isDisplayEntity(displayEntity)) {
					clipboard = {
						sourceName: displayEntity.name,
						onSummonFunction: displayEntity.onSummonFunction ?? '',
						configs: structuredClone(displayEntity.configs),
					}
					Blockbench.showQuickMessage(
						localize('action.copy_display_entity_config.message', clipboard.sourceName)
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
			name: localize('action.paste_display_entity_config.name'),
			condition: () =>
				!!clipboard &&
				activeProjectIsBlueprintFormat() &&
				isDisplayEntity(Group.first_selected ?? Outliner.selected.at(0)),
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
					const message = localize(
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
			name: localize('action.open_display_entity_config.name'),
			condition: () =>
				activeProjectIsBlueprintFormat() &&
				isDisplayEntity(Group.first_selected ?? Outliner.selected.at(0)),
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
			{
				name: 'menu.cube.color',
				icon: 'color_lens',
				children() {
					return markerColors.map((color, i) => {
						return {
							icon: 'bubble_chart',
							color: color.standard,
							// @ts-expect-error - Broken BB types
							name: color.name ?? 'cube.color.' + color.id,
							click(element: any) {
								// @ts-expect-error - any
								element.forSelected(obj => obj.setColor(i), 'Change color')
							},
						}
					})
				},
			},
			'randomize_marker_colors',
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
