import { translate } from '../util/translation'
import { applyModelVariant, clearModelVariant, Variant } from '../variants'
import { SvelteDialog } from './svelteDialog'
import { default as VariantPropertiesSvelteComponent } from './components/variantProperties.svelte'

export function openVariantPropertiesDialog(variant: Variant) {
	if (!Project?.animated_java_variants) return

	const previousVariant = Project.animated_java_variants.selectedVariant
	clearModelVariant()

	new SvelteDialog({
		title: translate('animated_java.dialog.variant_properties.title'),
		id: 'animated_java:variant_properties',
		width: 700,
		svelteComponent: VariantPropertiesSvelteComponent,
		svelteComponentProps: { variant },
		buttons: [translate('animated_java.dialog.close_button')],
		onCancel() {
			if (previousVariant) applyModelVariant(previousVariant)
		},
		onButton() {
			if (previousVariant) applyModelVariant(previousVariant)
		},
	}).show()
}
