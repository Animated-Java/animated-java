import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { SveltePanel } from 'svelte-patching-tools/blockbench'
import { openVariantConfigDialog } from '../../dialogs/variantConfig/variantConfig'
import { BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import { localize as translate } from '../../util/lang'
import { Variant } from '../../variants'
import VariantsPanel from './variants.svelte'

export const CREATE_VARIANT_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/create-variant`,
	create() {
		return new Blockbench.Action(`animated_java:action/create-variant`, {
			name: translate('action.variants.create'),
			icon: 'add',
			click() {
				new Variant('New Variant')
			},
		})
	},
})

export const DUPLICATE_VARIANT_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/duplicate-variant`,
	create() {
		return new Blockbench.Action(`animated_java:action/duplicate-variant`, {
			name: translate('action.variants.duplicate'),
			icon: 'content_copy',
			condition: () => !!Variant.selected,
			click() {
				if (!Variant.selected) return
				Variant.selected.duplicate()
			},
		})
	},
})

export const DELETE_VARIANT_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/delete-variant`,
	create() {
		return new Blockbench.Action(`animated_java:action/delete-variant`, {
			name: translate('action.variants.delete'),
			icon: 'delete',
			condition: () => !!Variant.selected && !Variant.selected.isDefault,
			click() {
				if (!Variant.selected || Variant.selected.isDefault) return
				Variant.selected.delete()
			},
		})
	},
})

export const OPEN_VARIANT_CONFIG_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/open-variant-config`,
	create() {
		return new Blockbench.Action(`animated_java:action/open-variant-config`, {
			name: translate('action.variants.open_config'),
			icon: 'settings',
			condition: () => !!Variant.selected && !Variant.selected.isDefault,
			click() {
				if (!Variant.selected) return
				openVariantConfigDialog(Variant.selected)
			},
		})
	},
})

export const VARIANT_PANEL_CONTEXT_MENU = registerDeletableHandlerPatch({
	id: 'animated_java:context-menu/variant-panel-context-menu',
	dependencies: [
		`animated_java:action/create-variant`,
		`animated_java:action/duplicate-variant`,
		`animated_java:action/delete-variant`,
		`animated_java:action/open-variant-config`,
	],
	create() {
		return new Blockbench.Menu(
			`animated_java:context-menu/variant-panel-context-menu`,
			[
				OPEN_VARIANT_CONFIG_ACTION.get()!,
				new MenuSeparator(),
				CREATE_VARIANT_ACTION.get()!,
				DUPLICATE_VARIANT_ACTION.get()!,
				new MenuSeparator(),
				DELETE_VARIANT_ACTION.get()!,
			],
			{}
		)
	},
})

export const VARIANTS_PANEL = new SveltePanel({
	id: `animated_java:variants-panel`,
	name: translate('panel.variants.title'),
	expand_button: true,
	default_side: 'right',
	default_position: {
		slot: 'left_bar',
		height: 200,
		float_position: [0, 0],
		float_size: [200, 200],
		folded: false,
	},
	icon: 'settings',
	condition: {
		formats: [BLUEPRINT_FORMAT_ID],
		modes: [Modes.options.edit.id, Modes.options.paint.id],
	},
	component: VariantsPanel,
	props: {},
})
