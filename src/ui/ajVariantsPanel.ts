import { ajModelFormat } from '../modelFormat'
import * as events from '../events'
import { createAction, createBlockbenchMod, createMenu } from '../util/moddingTools'
import { translate } from '../util/translation'
import { Variant } from '../variants'
import { SveltePanel } from './util/sveltePanel'
import { openVariantPropertiesDialog } from './ajVariantsProperties'
import { default as SvelteComponent } from './components/variantsPanel.svelte'

interface IState {
	recentlyClickedVariant: Variant | undefined
}

export const state: IState = {
	recentlyClickedVariant: undefined,
}

export const addVariantAction = createAction('animated_java:add_variant', {
	name: translate('animated_java.actions.add_variant.name'),
	icon: 'add_circle',
	description: translate('animated_java.actions.add_variant.description'),
	category: 'animated_java:variants',
	click() {
		if (!Project?.animated_java_variants) return
		const v = new Variant('new_variant')
		v.createUniqueName(Project.animated_java_variants.variants)
		Project.animated_java_variants.addVariant(v)
		openVariantPropertiesDialog(v)
	},
})

export const duplicateVariantAction = createAction('animated_java:duplicate_variant', {
	name: translate('animated_java.actions.duplicate_variant.name'),
	icon: 'content_copy',
	description: translate('animated_java.actions.duplicate_variant.description'),
	category: 'animated_java:variants',
	click() {
		if (!Project?.animated_java_variants) return
		let v = Project.animated_java_variants.selectedVariant
		if (state.recentlyClickedVariant) {
			v = state.recentlyClickedVariant
			state.recentlyClickedVariant = undefined
		}
		if (v) {
			const newVariant = v.clone()
			newVariant.createUniqueName(Project.animated_java_variants.variants)
			Project.animated_java_variants.addVariant(newVariant)
			Project.animated_java_variants.select(newVariant)
			openVariantPropertiesDialog(newVariant)
		}
	},
})

export const variantPropertiesAction = createAction('animated_java:variant_properties', {
	name: translate('animated_java.actions.variant_properties.name'),
	icon: 'list',
	description: translate('animated_java.actions.variant_properties.description'),
	category: 'animated_java:variants',
	click() {
		if (!Project?.animated_java_variants) return
		// console.log('variantPropertiesAction.click', event)
		let variant = Project.animated_java_variants.selectedVariant
		if (state.recentlyClickedVariant) {
			variant = state.recentlyClickedVariant
			state.recentlyClickedVariant = undefined
			openVariantPropertiesDialog(variant)
		}
	},
})

const VARIANT_PANEL_TOOLBAR = new Toolbar({
	id: 'animated_java:variants_toolbar',
	children: ['animated_java:add_variant'],
})

export const VARIANT_MENU = createMenu([
	'animated_java:variant_properties',
	'animated_java:duplicate_variant',
])
export const VARIANT_PANEL_MENU = createMenu(['animated_java:add_variant'])

createBlockbenchMod(
	'animated_java:variants_panel',
	{},
	() => {
		return new SveltePanel({
			id: 'animated_java:variants',
			name: translate('animated_java.panels.variants.name'),
			icon: 'movie',
			expand_button: true,
			growable: true,
			condition: () =>
				Format === ajModelFormat && Mode.selected && Mode.selected.id === 'edit',
			svelteComponent: SvelteComponent,
			svelteComponentProps: {},
			default_position: {
				height: 400,
				folded: false,
				slot: 'left_bar',
				float_position: [0, 0],
				float_size: [300, 400],
			},
			default_side: 'left',
			toolbars: {
				head: VARIANT_PANEL_TOOLBAR,
			},
		})
	},
	context => {
		context.delete()
	}
)

events.UNINSTALL.subscribe(() => {
	// toolbar.delete() no delete toolbar :(
	// VARIANT_MENU?.delete()
	// VARIANT_PANEL_MENU?.delete()
})
