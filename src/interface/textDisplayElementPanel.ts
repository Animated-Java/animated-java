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

export const TEXT_DISPLAY_BACKGROUND_COLOR_PICKER = new ColorPicker(
	`${PACKAGE.name}:textDisplayBackgroundColorPicker`,
	{
		name: 'Background Color',
		icon: 'format_color_fill',
		description: 'The background color of the text display.',
		condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
	}
)
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.get = function (this: ColorPicker) {
	const selected = TextDisplay.selected[0]
	if (!selected) return '#ffffff3f'
	return selected.backgroundColor
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set = function (this: ColorPicker, color: string) {
	this.value = new tinycolor(color)
	// @ts-expect-error
	this.jq.spectrum('set', this.value.toHex8String())

	const selected = TextDisplay.selected[0]
	if (!selected) return this
	selected.backgroundColor = this.value.toHexString()
	selected.backgroundAlpha = this.value.getAlpha()
	return this
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.change = function (
	this: ColorPicker,
	color: tinycolor.Instance
) {
	console.log('change', color)
	const selected = TextDisplay.selected[0]
	this.dispatchEvent('change', { color })
	if (!selected) return this
	selected.backgroundColor = color.toHexString()
	selected.backgroundAlpha = color.getAlpha()
	this.dispatchEvent('change', { color })
	return this
}
