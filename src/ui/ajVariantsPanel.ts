import { ajModelFormat } from '../modelFormat'
import * as events from '../util/events'
import { createBlockbenchMod } from '../util/mods'
import { translate } from '../util/translation'
import { Variant } from '../variants'
import { AJPanel } from './ajPanel'
import { openVariantPropertiesDialog } from './ajVariantsProperties'
import { default as SvelteComponent } from './components/variantsPanel.svelte'

interface IState {
	recentlyClickedVariant: Variant | undefined
}

export let state: IState = {
	recentlyClickedVariant: undefined,
}

export const addVariantAction = new Action('animated_java:add_variant', {
	name: translate('animated_java.actions.add_variant.name'),
	icon: 'add_circle',
	description: translate('animated_java.actions.add_variant.description'),
	category: 'animated_java:variants',
	click(event) {
		if (!(Project && Project.animated_java_variants)) return
		const v = new Variant('new_variant')
		v.createUniqueName(Project.animated_java_variants.variants)
		Project.animated_java_variants.addVariant(v)
		openVariantPropertiesDialog(v)
	},
})

export const variantPropertiesAction = new Action('animated_java:variant_properties', {
	name: translate('animated_java.actions.variant_properties.name'),
	icon: 'list',
	description: translate('animated_java.actions.variant_properties.description'),
	category: 'animated_java:variants',
	click(event) {
		console.log('variantPropertiesAction.click', event)
		let variant = Project!.animated_java_variants!.selectedVariant!
		if (state.recentlyClickedVariant) {
			variant = state.recentlyClickedVariant
			state.recentlyClickedVariant = undefined
		}
		openVariantPropertiesDialog(variant)
	},
})

const toolbar = new Toolbar({
	id: 'animated_java:variants_toolbar',
	children: ['animated_java:add_variant'],
})

export const variantMenu = new Menu(['animated_java:variant_properties'])
export const variantPanelMenu = new Menu(['animated_java:add_variant'])

let panel: Panel
createBlockbenchMod(
	'animated_java:variants_panel',
	{},
	context => {
		panel = new AJPanel(
			SvelteComponent,
			{},
			{
				id: 'animated_java:variants',
				name: translate('animated_java.panels.variants.name'),
				icon: 'movie',
				expand_button: true,
				condition: () =>
					Format.id === ajModelFormat.id && Mode.selected && Mode.selected.id === 'edit',
				component: null,
				default_position: {
					height: 400,
					folded: false,
					slot: 'left_bar',
					float_position: [0, 0],
					float_size: [300, 400],
				},
				default_side: 'left',
				toolbars: {
					head: toolbar,
				},
			}
		)
	},
	context => {
		panel?.delete()
	}
)

events.uninstall.subscribe(() => {
	// toolbar.delete() no delete toolbar :(
	variantMenu?.delete()
	variantPanelMenu?.delete()
	addVariantAction?.delete()
	variantPropertiesAction?.delete()
})
