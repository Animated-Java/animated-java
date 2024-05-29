import { isCurrentFormat } from '../blueprintFormat'
import TextDisplayElementPanel from '../components/textDisplayElementPanel.svelte'
import { PACKAGE } from '../constants'
import { TextDisplay } from '../outliner/textDisplay'
import { injectSvelteCompomponentMod } from '../util/injectSvelte'
import { floatToHex } from '../util/misc'

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
// @ts-expect-error
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.jq.spectrum('option', 'defaultColor', '#0000003f')
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.get = function () {
	const selected = TextDisplay.selected[0]
	if (!selected) return new tinycolor('#0000003f')
	return new tinycolor(selected.backgroundColor + floatToHex(selected.backgroundAlpha))
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
	const selected = TextDisplay.selected[0]
	if (!selected) return this
	selected.backgroundColor = color.toHexString()
	selected.backgroundAlpha = color.getAlpha()
	return this
}

export const TEXT_DISPLAY_SHADOW_TOGGLE = new Toggle(`${PACKAGE.name}:textDisplayShadowToggle`, {
	name: 'Text Shadow',
	icon: 'check_box_outline_blank',
	description: 'Whether the text has a shadow.',
	condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
	click() {
		//
	},
	onChange() {
		const scope = TEXT_DISPLAY_SHADOW_TOGGLE
		scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
		const selected = TextDisplay.selected[0]
		if (!selected) return
		selected.shadow = TEXT_DISPLAY_SHADOW_TOGGLE.value
	},
})
TEXT_DISPLAY_SHADOW_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click()
	return this
}
