import { isCurrentFormat } from '../../blueprintFormat'
import VariantsPanel from '../../components/variantsPanel.svelte'
import { PACKAGE } from '../../constants'
import { createAction, createMenu } from '../../util/moddingTools'
import { SveltePanel } from '../../util/sveltePanel'
import { translate } from '../../util/translation'
import { Variant } from '../../variants'
import { openVariantConfigDialog } from '../dialog/variantConfig'

export const CREATE_VARIANT_ACTION = createAction(`${PACKAGE.name}:createVariant`, {
	name: translate('action.variants.create'),
	icon: 'add',
	click() {
		new Variant('New Variant')
	},
})

export const DUPLICATE_VARIANT_ACTION = createAction(`${PACKAGE.name}:duplicateVariant`, {
	name: translate('action.variants.duplicate'),
	icon: 'content_copy',
	condition: () => !!Variant.selected,
	click() {
		if (!Variant.selected) return
		Variant.selected.duplicate()
	},
})

export const DELETE_VARIANT_ACTION = createAction(`${PACKAGE.name}:deleteVariant`, {
	name: translate('action.variants.delete'),
	icon: 'delete',
	condition: () => !!Variant.selected && !Variant.selected.isDefault,
	click() {
		if (!Variant.selected || Variant.selected.isDefault) return
		Variant.selected.delete()
	},
})

export const OPEN_VARIANT_CONFIG_ACTION = createAction(`${PACKAGE.name}:openVariantConfig`, {
	name: translate('action.variants.open_config'),
	icon: 'settings',
	condition: () => !!Variant.selected && !Variant.selected.isDefault,
	click() {
		if (!Variant.selected) return
		openVariantConfigDialog(Variant.selected)
	},
})

export const VARIANT_PANEL_CONTEXT_MENU = createMenu(
	[
		OPEN_VARIANT_CONFIG_ACTION.id,
		new MenuSeparator(),
		CREATE_VARIANT_ACTION.id,
		DUPLICATE_VARIANT_ACTION.id,
		new MenuSeparator(),
		DELETE_VARIANT_ACTION.id,
	],
	{}
)

export const VARIANTS_PANEL = new SveltePanel({
	id: `${PACKAGE.name}:variantsPanel`,
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
	condition: () =>
		!!(
			isCurrentFormat() &&
			Modes.selected &&
			(Modes.selected.id === Modes.options.edit.id ||
				Modes.selected.id === Modes.options.paint.id)
		),
	component: VariantsPanel,
	props: {},
})
