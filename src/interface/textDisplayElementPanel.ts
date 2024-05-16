import { isCurrentFormat } from '../blueprintFormat'
import TextDisplayElementPanel from '../components/dialogItems/textDisplayElementPanel.svelte'
import { PACKAGE } from '../constants'
import { TextDisplay } from '../outliner/textDisplay'
import { injectSvelteCompomponentMod } from '../util/injectSvelte'

injectSvelteCompomponentMod({
	svelteComponent: TextDisplayElementPanel,
	svelteComponentProperties: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})

new BarSlider(`${PACKAGE.name}:textDisplayLineWidthSlider`, {
	name: 'Line Width',
	icon: 'format_size',
	description: 'The width of the text display.',
	settings: {
		min: 1,
		max: 10000,
	},
	condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
})
