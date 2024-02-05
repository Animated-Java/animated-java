import { isCurrentFormat } from '../blueprintFormat'
import VariantsPanel from '../components/variantsPanel.svelte'
import { PACKAGE } from '../constants'
import { SveltePanel } from '../util/sveltePanel'
import { translate } from '../util/translation'

export const VARIANTS_PANEL = new SveltePanel({
	id: `${PACKAGE.name}:variantsPanel`,
	name: translate('panel.variants.title'),
	expand_button: true,
	default_side: 'right',
	default_position: {
		slot: 'left_bar',
		height: 200,
		float_position: [0, 0],
		float_size: [200, 200],
		folded: false,
	},
	icon: 'settings',
	condition: () =>
		!!(isCurrentFormat() && Modes.selected && Modes.selected.id === Modes.options.edit.id),
	svelteComponent: VariantsPanel,
	svelteComponentProps: {},
})
