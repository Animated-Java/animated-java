import { translate } from '../util/translation'
import { applyModelVariant, clearModelVariant, Variant } from '../variants'
import { AJDialog } from './ajDialog'
import { default as SvelteComponent } from './components/variantProperties.svelte'

export function openVariantPropertiesDialog(variant: Variant) {
	if (!(Project && Project.animated_java_variants)) return

	const previousVariant = Project.animated_java_variants.selectedVariant!
	clearModelVariant()

	const dialog = new AJDialog(
		SvelteComponent,
		{ variant },
		{
			title: translate('animated_java.dialog.variant_properties.title'),
			id: 'animated_java:variant_properties',
			width: 700,
			buttons: [translate('animated_java.dialog.variant_properties.close_button')],
			onCancel() {
				applyModelVariant(previousVariant)
			},
			onButton() {
				applyModelVariant(previousVariant)
			},
		}
	).show()
}
