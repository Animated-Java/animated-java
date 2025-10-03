import { registerAction, registerMenu } from 'src/util/moddingTools'
import { BLUEPRINT_FORMAT_ID } from '../../blueprintFormat'
import VariantsPanel from '../../components/variantsPanel.svelte'
import { SveltePanel } from '../../util/sveltePanel'
import { translate } from '../../util/translation'
import { Variant } from '../../variants'
import { openVariantConfigDialog } from '../dialog/variantConfig'

export const CREATE_VARIANT_ACTION = registerAction(
	{ id: `animated-java:create-variant` },
	{
		name: translate('action.variants.create'),
		icon: 'add',
		click() {
			new Variant('New Variant')
		},
	}
)

export const DUPLICATE_VARIANT_ACTION = registerAction(
	{ id: `animated-java:duplicate-variant` },
	{
		name: translate('action.variants.duplicate'),
		icon: 'content_copy',
		condition: () => !!Variant.selected,
		click() {
			if (!Variant.selected) return
			Variant.selected.duplicate()
		},
	}
)

export const DELETE_VARIANT_ACTION = registerAction(
	{ id: `animated-java:delete-variant` },
	{
		name: translate('action.variants.delete'),
		icon: 'delete',
		condition: () => !!Variant.selected && !Variant.selected.isDefault,
		click() {
			if (!Variant.selected || Variant.selected.isDefault) return
			Variant.selected.delete()
		},
	}
)

export const OPEN_VARIANT_CONFIG_ACTION = registerAction(
	{ id: `animated-java:open-variant-config` },
	{
		name: translate('action.variants.open_config'),
		icon: 'settings',
		condition: () => !!Variant.selected && !Variant.selected.isDefault,
		click() {
			if (!Variant.selected) return
			openVariantConfigDialog(Variant.selected)
		},
	}
)

export const VARIANT_PANEL_CONTEXT_MENU = registerMenu(
	{ id: 'animated-java:variant-panel-context-menu' },
	() => {
		const items = [
			OPEN_VARIANT_CONFIG_ACTION.get(),
			new MenuSeparator(),
			CREATE_VARIANT_ACTION.get(),
			DUPLICATE_VARIANT_ACTION.get(),
			new MenuSeparator(),
			DELETE_VARIANT_ACTION.get(),
		]

		if (items.every(i => i != undefined)) return items

		return []
	},
	{}
)

export const VARIANTS_PANEL = new SveltePanel({
	id: `animated-java:variants-panel`,
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
