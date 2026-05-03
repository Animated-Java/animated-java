import {
	registerDeletableHandlerPatch,
	registerPropertyOverridePatch,
} from 'blockbench-patch-manager'
import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint'
import { InteractionConfig } from '../../nodeConfigs'
import { localize } from '../../util/lang'
import LocatorConfigDialog from './interactionConfig.svelte'

// TODO - Make on-tick function work without requiring use-entity.

export function openInteractionConfigDialog(interaction: BoundingBox) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the bounding box instead of the actual BoundingBoxConfig object
	const boundingBoxConfig = InteractionConfig.fromJSON(
		// @ts-expect-error - Broken BB types
		(interaction.config ??= new InteractionConfig().toJSON())
	)

	const response = observable(boundingBoxConfig.response)
	const onSummonFunction = observable(boundingBoxConfig.onSummonFunction)
	const onInteractionFunction = observable(boundingBoxConfig.onInteractionFunction)
	const onAttackFunction = observable(boundingBoxConfig.onAttackFunction)
	const onRemoveFunction = observable(boundingBoxConfig.onRemoveFunction)
	const onTickFunction = observable(boundingBoxConfig.onTickFunction)

	new SvelteDialog({
		id: `${PACKAGE.name}:interactionConfig`,
		title: localize('dialog.interaction_config.title'),
		width: 800,
		component: LocatorConfigDialog,
		props: {
			response,
			onSummonFunction,
			onInteractionFunction,
			onAttackFunction,
			onRemoveFunction,
			onTickFunction,
		},
		disableKeybinds: true,
		onConfirm() {
			boundingBoxConfig.response = response.get()
			boundingBoxConfig.onSummonFunction = onSummonFunction.get()
			boundingBoxConfig.onInteractionFunction = onInteractionFunction.get()
			boundingBoxConfig.onAttackFunction = onAttackFunction.get()
			boundingBoxConfig.onRemoveFunction = onRemoveFunction.get()
			boundingBoxConfig.onTickFunction = onTickFunction.get()

			// @ts-expect-error - Broken BB types
			interaction.config = boundingBoxConfig.toJSON()
		},
	}).show()
}

const OPEN_INTERACTION_CONFIG = registerDeletableHandlerPatch({
	id: `animated_java:action/interaction-config`,
	create() {
		// @ts-expect-error - Broken BB types
		const action = new Blockbench.Action(`animated_java:action/interaction-config`, {
			icon: 'settings',
			name: localize('action.open_interaction_config.name'),
			condition: () => activeProjectIsBlueprintFormat(),
			click: () => {
				const interaction = BoundingBox.selected.at(0)
				if (!interaction) return
				// @ts-expect-error - Broken BB types
				openInteractionConfigDialog(interaction)
			},
		})
		return action
	},
})

registerPropertyOverridePatch({
	id: `animated_java:bounding-box/extend`,
	target: BoundingBox.prototype,
	key: 'extend',

	get: function (this, value) {
		if (activeProjectIsBlueprintFormat()) {
			return function (this: BoundingBox, ...args) {
				const result = value.apply(this, args)
				this.menu = BoundingBox.prototype.menu
				return result
			}
		}
		return value
	},
})

registerPropertyOverridePatch({
	id: `animated_java:bounding-box/menu`,
	dependencies: [`animated_java:action/interaction-config`],
	target: BoundingBox.prototype,
	key: 'menu',

	get: function (this, value) {
		if (activeProjectIsBlueprintFormat()) {
			return new Menu([
				...Outliner.control_menu_group,
				new MenuSeparator('export'),
				'generate_bedrock_block_box',
				'generate_bedrock_entity_box',
				new MenuSeparator('interaction'),
				OPEN_INTERACTION_CONFIG.get(),
				new MenuSeparator('settings'),
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
								click(element: BoundingBox) {
									// @ts-expect-error - Broken BB types
									element.forSelected((obj: BoundingBox) => {
										obj.setColor(i)
									}, 'Change color')
								},
							}
						})
					},
				},
				'randomize_marker_colors',
				new MenuSeparator('manage'),
				'rename',
				'toggle_visibility',
				'delete',
			])
		}
		return value
	},
})
