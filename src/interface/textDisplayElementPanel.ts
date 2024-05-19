import { isCurrentFormat } from '../blueprintFormat'
import TextDisplayElementPanel from '../components/textDisplayElementPanel.svelte'
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

export const TEXT_DISPLAY_WIDTH_SLIDER = new NumSlider(
	`${PACKAGE.name}:textDisplayLineWidthSlider`,
	{
		name: 'Line Width',
		icon: 'format_size',
		description: 'The width of the text display.',
		settings: {
			min: 1,
			max: 10000,
			interval: 1,
		},
		condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
		get() {
			const selected = TextDisplay.selected[0]
			if (!selected) return 0
			return selected.lineWidth
		},
		change(value) {
			const selected = TextDisplay.selected[0]
			if (!selected) return
			selected.lineWidth = Math.clamp(value(selected.lineWidth), 1, 10000)
		},
	}
)
