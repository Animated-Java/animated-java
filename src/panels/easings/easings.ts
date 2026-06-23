import { SveltePanel } from 'svelte-patching-tools/blockbench'
import { BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import { createScopedTranslator } from '../../util/lang'
import EasingsPanelComponent from './easings.svelte'

const localize = createScopedTranslator('animated_java.panel.easings')

export const EASINGS_PANEL = new SveltePanel({
	id: `animated_java:panel/easings`,
	name: localize('title'),
	component: EasingsPanelComponent,
	expand_button: false,
	icon: 'timeline',
	condition: {
		formats: [BLUEPRINT_FORMAT_ID],
		modes: [Modes.options.animate.id],
	},
	default_position: {
		slot: 'left_bar',
		folded: false,
		float_position: [0, 0],
		float_size: [200, 200],
		height: 200,
		// @ts-expect-error - Missing types
		attached_to: 'transform',
		attached_index: 1,
		sidebar_index: 2,
	},
	default_side: 'left',
})
