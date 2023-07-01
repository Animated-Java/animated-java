import { translate } from '../util/translation'
// import { applyModelVariant, resetModelVariant, Variant } from '../variants'
import { Variant } from '../variants'
import { SvelteDialog } from './util/svelteDialog'
import { default as VariantPropertiesSvelteComponent } from './components/variantProperties.svelte'

export function openVariantPropertiesDialog(variant: Variant) {
	if (!Project?.animated_java_variants) return

	new SvelteDialog({
		title: translate('animated_java.dialog.variant_properties.title'),
		id: 'animated_java:variant_properties',
		width: 700,
		svelteComponent: VariantPropertiesSvelteComponent,
		svelteComponentProps: { variant },
		buttons: [translate('animated_java.dialog.close_button')],
		onClose() {
			// console.log('onButton')
			Project.animated_java_variants!.select(Project.animated_java_variants!.selectedVariant)
			Project.animated_java_variants!.sortVariants()
		},
	}).show()
}
