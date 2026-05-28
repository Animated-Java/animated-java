import {
	registerDeletableHandlerPatch,
	registerPropertyOverridePatch,
} from 'blockbench-patch-manager'
import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint'
import { InteractionConfig } from '../../nodeConfigs'
import { Interaction } from '../../outliner/interaction'
import { localize } from '../../util/lang'
import LocatorConfigDialog from './interactionConfig.svelte'

export function openInteractionConfigDialog(interaction: Interaction) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the interaction instead of the actual InteractionConfig object
	const interactionConfig = InteractionConfig.fromJSON(
		(interaction.config ??= new InteractionConfig().toJSON())
	)

	const response = observable(interactionConfig.response)
	const onSummonFunction = observable(interactionConfig.onSummonFunction)
	const onInteractFunction = observable(interactionConfig.onInteractFunction)
	const onAttackFunction = observable(interactionConfig.onAttackFunction)
	const onRemoveFunction = observable(interactionConfig.onRemoveFunction)
	const onTickFunction = observable(interactionConfig.onTickFunction)

	new SvelteDialog({
		id: `${PACKAGE.name}:interactionConfig`,
		title: localize('dialog.interaction_config.title'),
		width: 800,
		component: LocatorConfigDialog,
		props: {
			response,
			onSummonFunction,
			onInteractFunction,
			onAttackFunction,
			onRemoveFunction,
			onTickFunction,
		},
		disableKeybinds: true,
		onConfirm() {
			interactionConfig.response = response.get()
			interactionConfig.onSummonFunction = onSummonFunction.get()
			interactionConfig.onInteractFunction = onInteractFunction.get()
			interactionConfig.onAttackFunction = onAttackFunction.get()
			interactionConfig.onRemoveFunction = onRemoveFunction.get()
			interactionConfig.onTickFunction = onTickFunction.get()

			interaction.config = interactionConfig.toJSON()

			Project!.saved = false
		},
	}).show()
}

registerDeletableHandlerPatch({
	id: `animated_java:action/interaction-config`,
	dependencies: ['animated_java:action/create-interaction'],
	create() {
		// @ts-expect-error - Broken BB types
		const action = new Blockbench.Action(`animated_java:action/interaction-config`, {
			icon: 'settings',
			name: localize('action.open_interaction_config.name'),
			condition: () => activeProjectIsBlueprintFormat(),
			click: () => {
				const interaction = Interaction.selected.at(0)
				if (!interaction) return
				openInteractionConfigDialog(interaction)
			},
		})

		Interaction.prototype.menu = new Menu([
			...Outliner.control_menu_group,
			'_',
			action,
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
							click(element: Interaction) {
								// @ts-expect-error - Broken BB types
								element.forSelected((obj: Interaction) => {
									obj.setColor(i)
								}, 'Change color')
							},
						}
					})
				},
			},
			'randomize_marker_colors',
			'_',
			'rename',
			'toggle_visibility',
			'delete',
		])

		return action
	},
})

registerPropertyOverridePatch({
	id: `animated_java:bounding-box/extend`,
	target: Interaction.prototype,
	key: 'extend',

	get: function (this, value) {
		if (activeProjectIsBlueprintFormat()) {
			return function (this: Interaction, ...args) {
				const result = value.apply(this, args)
				this.menu = Interaction.prototype.menu
				return result
			}
		}
		return value
	},
})
