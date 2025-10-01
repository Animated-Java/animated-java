import { isCurrentFormat } from '../../blueprintFormat'
import TextDisplayElementPanel from '../../components/textDisplayElementPanel.svelte'
import { PACKAGE } from '../../constants'
import { type Alignment, TextDisplay } from '../../outliner/textDisplay'
import { injectSvelteComponentMod } from '../../util/injectSvelteComponent'
import { floatToHex } from '../../util/misc'
import { translate } from '../../util/translation'

injectSvelteComponentMod({
	component: TextDisplayElementPanel,
	props: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})

type Grammar = ReturnType<typeof Prism.languages.extend>
type GrammarValue = NonNullable<Grammar['property']>

function addPrismSyntaxForSnbtTextComponents() {
	const quotes: GrammarValue = {
		pattern: /^['"]|['"]$/,
		alias: 'quotation',
	}

	Prism.languages.snbtTextComponent = Prism.languages.extend('json', {
		punctuation: /[,:]/,
		brackets: {
			pattern: /[{}[\]]/g,
		},
		property: [
			{
				pattern: /('|")?\w+\1\s*(?=\s*:)/,
				inside: {
					punctuation: quotes,
				},
			},
		],
		string: [
			{
				pattern: /("|')(?:\\(?:\r\n?|\n|.)|(?!\1)[^\\\r\n])*\1/,
				greedy: true,
				inside: {
					punctuation: quotes,
					'named-unicode-escape-sequence': {
						pattern: /\\N\{ *[\w ]+ *\}/,
						alias: 'escape-sequence',
						inside: {
							constant: {
								pattern: /(\\N\{ *)[\w ]+?(?= *\})/,
								lookbehind: true,
							},
						},
					},
					'unicode-escape-sequence': {
						pattern: /\\(?:x[\da-fA-F]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8})/,
						alias: 'escape-sequence',
						inside: {
							constant: { pattern: /(?:[\da-fA-F]+)/ },
						},
					},
					'escape-sequence': {
						pattern: /\\(?:n|s|t|b|f|r|'|"|\\)/,
					},
				},
			},
			{
				pattern: /([:,]\s*)\b(?!true|false)\w+\b/i,
				inside: { punctuation: quotes },
				lookbehind: true,
			},
		],
		boolean: {
			pattern: /\b(?:true|false|0b|1b)\b/i,
		},
		number: /[-]?(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[eE][+-]?\d+\b)?/,
	})
}

addPrismSyntaxForSnbtTextComponents()

export const TEXT_DISPLAY_WIDTH_SLIDER = new NumSlider(
	`${PACKAGE.name}:textDisplayLineWidthSlider`,
	{
		name: translate('tool.text_display.line_width.title'),
		icon: 'format_size',
		description: translate('tool.text_display.line_width.description'),
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
			if (!Project) return
			const selected = TextDisplay.selected[0]
			if (!selected) return
			const newLineWidth = Math.clamp(value(selected.lineWidth), 1, 10000)
			if (selected.lineWidth === newLineWidth) return
			selected.lineWidth = newLineWidth
			Project.saved = false
		},
	}
)

export const TEXT_DISPLAY_BACKGROUND_COLOR_PICKER = new ColorPicker(
	`${PACKAGE.name}:textDisplayBackgroundColorPicker`,
	{
		name: translate('tool.text_display.background_color.title'),
		icon: 'format_color_fill',
		description: translate('tool.text_display.background_color.description'),
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
	color: InstanceType<typeof tinycolor>
) {
	if (!Project) return this
	const selected = TextDisplay.selected[0]
	if (!selected) return this
	const newBackground = color.toHexString()
	const newAlpha = color.getAlpha()
	if (selected.backgroundColor === newBackground && selected.backgroundAlpha === newAlpha)
		return this
	selected.backgroundColor = newBackground
	selected.backgroundAlpha = newAlpha
	Project!.saved = false
	return this
}

export const TEXT_DISPLAY_SHADOW_TOGGLE = new Toggle(`${PACKAGE.name}:textDisplayShadowToggle`, {
	name: translate('tool.text_display.text_shadow.title'),
	icon: 'check_box_outline_blank',
	description: translate('tool.text_display.text_shadow.description'),
	condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
	onChange() {
		if (!Project) return
		const scope = TEXT_DISPLAY_SHADOW_TOGGLE
		scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
		const selected = TextDisplay.selected[0]
		if (!selected) return
		if (selected.shadow === TEXT_DISPLAY_SHADOW_TOGGLE.value) return
		selected.shadow = TEXT_DISPLAY_SHADOW_TOGGLE.value
		Project!.saved = false
	},
})
TEXT_DISPLAY_SHADOW_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click()
	return this
}

export const TEXT_DISPLAY_ALIGNMENT_SELECT = new BarSelect(
	`${PACKAGE.name}:textDisplayAlignmentSelect`,
	{
		name: translate('tool.text_display.text_alignment.title'),
		icon: 'format_align_left',
		description: translate('tool.text_display.text_alignment.description'),
		condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
		options: {
			left: translate('tool.text_display.text_alignment.options.left'),
			center: translate('tool.text_display.text_alignment.options.center'),
			right: translate('tool.text_display.text_alignment.options.right'),
		},
	}
)
TEXT_DISPLAY_ALIGNMENT_SELECT.get = function () {
	const selected = TextDisplay.selected[0]
	if (!selected) return 'left'
	return selected.align
}
TEXT_DISPLAY_ALIGNMENT_SELECT.set = function (this: BarSelect<Alignment>, value: Alignment) {
	const selected = TextDisplay.selected[0]
	if (!selected) return this
	this.value = value
	const name = this.getNameFor(value)
	this.nodes.forEach(node => {
		$(node).find('bb-select').text(name)
	})
	if (!this.nodes.includes(this.node)) {
		$(this.node).find('bb-select').text(name)
	}
	selected.align = value
	return this
}

export const TEXT_DISPLAY_SEE_THROUGH_TOGGLE = new Toggle(
	`${PACKAGE.name}:textDisplaySeeThroughToggle`,
	{
		name: translate('tool.text_display.see_through.title'),
		icon: 'check_box_outline_blank',
		description: translate('tool.text_display.see_through.description'),
		condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
		onChange() {
			if (!Project) return
			const scope = TEXT_DISPLAY_SEE_THROUGH_TOGGLE
			scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
			const selected = TextDisplay.selected[0]
			if (!selected) return
			if (selected.seeThrough === TEXT_DISPLAY_SEE_THROUGH_TOGGLE.value) return
			selected.seeThrough = TEXT_DISPLAY_SEE_THROUGH_TOGGLE.value
			Project!.saved = false
		},
	}
)
TEXT_DISPLAY_SEE_THROUGH_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click()
	return this
}
