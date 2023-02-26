import { ajModelFormat } from '../modelFormat'
import { BlockbenchMod } from '../util/mods'
import { translate } from '../util/translation'
import { AJPanel } from './ajPanel'
import { default as SvelteComponent } from './components/variantsPanel.svelte'

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
				menu: new Menu(['animated_java:settings']),
			}
		)
	},
	extract() {
		panel?.delete()
	},
})
