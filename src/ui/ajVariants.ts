import { ajModelFormat } from '../modelFormat'
import { BlockbenchMod } from '../mods'
import { translate } from '../translation'
import { AJPanel } from './ajPanel'
import { default as SvelteComponent } from './components/variants.svelte'

let panel: Panel

new BlockbenchMod({
	id: 'animated_java:variants_panel',
	inject() {
		panel = new AJPanel(
			SvelteComponent,
			{},
			{
				id: 'animated_java:variants',
				name: translate('animated_java.panels.variants.name'),
				icon: 'movie',
				expand_button: true,
				condition: () => Format.id === ajModelFormat.id,
				component: null,
				default_position: {
					height: 400,
					folded: false,
					slot: 'right_bar',
					float_position: [0, 0],
					float_size: [300, 400],
				},
				default_side: 'right',
			}
		)
	},
	extract() {
		panel?.delete()
	},
})
