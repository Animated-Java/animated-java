import { translate } from '../util/translation'
import { Variant } from '../variants'
import { AJDialog } from './ajDialog'
import { default as SvelteComponent } from './components/variantProperties.svelte'

export function openVariantPropertiesDialog(variant: Variant) {
	const dialog = new AJDialog(
		SvelteComponent,
		{ variant },
		{
			title: translate('animated_java.dialog.variant_properties.title'),
			id: 'animated_java.variant_properties',
			width: 700,
			buttons: [translate('animated_java.dialog.variant_properties.close_button')],
		}
	).show()
}
