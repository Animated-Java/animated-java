import { translate } from '../../util/translation'
import { TextureMapping, Variant } from '../../variants'
import { AJDialog } from '../ajDialog'
import { default as SvelteComponent } from '../components/popups/invalidVariant.svelte'

export function openInvalidVariantPopup(
	variant: Variant,
	removedTextureMappings: TextureMapping[]
) {
	const dialog = new AJDialog(
		SvelteComponent,
		{ variant, removedTextureMappings },
		{
			title: translate('animated_java.popup.invalid_texture_mapping.title'),
			id: 'animated_java:popup.invalid_variant',
			width: 700,
			buttons: [translate('animated_java.popup.invalid_texture_mapping.close_button')],
		}
	).show()
}
