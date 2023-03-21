import { translate } from '../../util/translation'
import { ITextureMapping, Variant } from '../../variants'
import { SvelteDialog } from '../util/svelteDialog'
import { default as SvelteComponent } from '../components/popups/invalidVariant.svelte'

export function openInvalidVariantPopup(
	variant: Variant,
	removedTextureMappings: ITextureMapping[]
) {
	new SvelteDialog({
		title: translate('animated_java.popup.invalid_texture_mapping.title'),
		id: 'animated_java:popup.invalid_variant',
		width: 700,
		stackable: true,
		svelteComponent: SvelteComponent,
		svelteComponentProps: { variant, removedTextureMappings },
		buttons: [translate('animated_java.popup.close_button')],
	}).show()
}
