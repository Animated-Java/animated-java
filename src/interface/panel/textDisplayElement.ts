import { JsonTextParser } from 'src/systems/jsonText/parser'
import EVENTS from 'src/util/events'
import { registerProjectMod } from 'src/util/moddingTools'
import { mountSvelteComponent } from 'src/util/mountSvelteComponent'
import TextDisplayElementPanel from '../../components/textDisplayElementPanel.svelte'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../../formats/blueprint'
import { type Alignment, TextDisplay } from '../../outliner/textDisplay'
import { translate } from '../../util/translation'

let mounted: TextDisplayElementPanel | null = null

const destroyMounted = () => {
	mounted?.$destroy()
	mounted = null
}

const updatePanel = () => {
	destroyMounted()
	const textDisplay = TextDisplay.selected.at(0)
	if (textDisplay) {
		mounted = mountSvelteComponent({
			component: TextDisplayElementPanel,
			props: { selected: textDisplay },
			target: '#panel_element',
		})
	}
}

registerProjectMod({
	id: 'animated-java:append-element-panel/text-display',

	condition: project => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const unsubscribers = [EVENTS.UPDATE_SELECTION.subscribe(updatePanel)]
		return { unsubscribers }
	},

	revert: ({ unsubscribers }) => {
		unsubscribers.forEach(u => u())
		destroyMounted()
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
		number: /(?:(?:#|0x)[\dA-Fa-f_]{1,8}\b|[-]?(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.[\d_]+)(?:[eE][+-]?[\d_]+\b)?)/,
	})
}

addPrismSyntaxForSnbtTextComponents()

const TEXT_DISPLAY_CONDITION = () =>
	activeProjectIsBlueprintFormat() && !!TextDisplay.selected.length

export const TEXT_DISPLAY_WIDTH_SLIDER = new NumSlider(
	`animated-java:text-display-line-width-slider`,
	{
		name: translate('tool.text_display.line_width.title'),
		icon: 'format_size',
		description: translate('tool.text_display.line_width.description'),
		settings: {
			min: 1,
			max: 10000,
			interval: 1,
		},
		condition: TEXT_DISPLAY_CONDITION,
		get() {
			const selected = TextDisplay.selected.at(0)
			if (!selected) return TextDisplay.properties.lineWidth.default as number
			return selected.lineWidth
		},
		change(value) {
			if (!Project) return
			const selected = TextDisplay.selected.at(0)
			if (!selected) return
			const newLineWidth = Math.clamp(value(selected.lineWidth), 1, 10000)
			if (selected.lineWidth === newLineWidth) return
			selected.lineWidth = newLineWidth
			selected.updateTextMesh()
			Project.saved = false
		},
	}
)

export const TEXT_DISPLAY_BACKGROUND_COLOR_PICKER = new ColorPicker(
	`animated-java:text-display-background-color-picker`,
	{
		name: translate('tool.text_display.background_color.title'),
		icon: 'format_color_fill',
		description: translate('tool.text_display.background_color.description'),
		condition: TEXT_DISPLAY_CONDITION,
	}
)
// @ts-expect-error Missing types
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.jq.spectrum(
	'option',
	'defaultColor',
	TextDisplay.properties.backgroundColor.default
)
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.get = function () {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return tinycolor(TextDisplay.properties.backgroundColor.default)
	return tinycolor(selected.backgroundColor)
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set = function (this: ColorPicker, color: tinycolor.Instance) {
	this.value = color
	// @ts-expect-error Missing types
	this.jq.spectrum('set', color.toHex8String())

	const selected = TextDisplay.selected.at(0)
	if (!selected) return this

	const value = color.toHex8String()
	if (selected.backgroundColor === value) return this

	selected.backgroundColor = color.toHex8String()
	selected.updateTextMesh()
	Project!.saved = false
	return this
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.change = function (
	this: ColorPicker,
	color: InstanceType<typeof tinycolor>
) {
	if (!Project) return this
	const selected = TextDisplay.selected.at(0)
	if (!selected) return this

	const newBackground = color.toHex8String()

	if (selected.backgroundColor === newBackground) return this

	selected.backgroundColor = newBackground
	selected.updateTextMesh()
	Project!.saved = false
	return this
}

export const TEXT_DISPLAY_SHADOW_TOGGLE = new Toggle(`animated-java:text-display-shadow-toggle`, {
	name: translate('tool.text_display.text_shadow.title'),
	icon: 'check_box_outline_blank',
	description: translate('tool.text_display.text_shadow.description'),
	condition: TEXT_DISPLAY_CONDITION,
	default: TextDisplay.properties.shadow.default as boolean,
	onChange() {
		if (!Project) return
		const scope = TEXT_DISPLAY_SHADOW_TOGGLE
		scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
		const selected = TextDisplay.selected.at(0)
		if (!selected) return
		if (selected.shadow === TEXT_DISPLAY_SHADOW_TOGGLE.value) return
		selected.shadow = TEXT_DISPLAY_SHADOW_TOGGLE.value
		selected.updateTextMesh()
		Project!.saved = false
	},
})
TEXT_DISPLAY_SHADOW_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click()
	return this
}

export const TEXT_DISPLAY_ALIGNMENT_SELECT = new BarSelect(
	`animated-java:text-display-alignment-select`,
	{
		name: translate('tool.text_display.text_alignment.title'),
		icon: 'format_align_left',
		description: translate('tool.text_display.text_alignment.description'),
		condition: TEXT_DISPLAY_CONDITION,
		options: {
			left: translate('tool.text_display.text_alignment.options.left'),
			center: translate('tool.text_display.text_alignment.options.center'),
			right: translate('tool.text_display.text_alignment.options.right'),
		},
	}
)
TEXT_DISPLAY_ALIGNMENT_SELECT.get = function () {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return TextDisplay.properties.align.default as Alignment
	return selected.align
}
TEXT_DISPLAY_ALIGNMENT_SELECT.set = function (this: BarSelect<Alignment>, value: Alignment) {
	const selected = TextDisplay.selected.at(0)
	if (!selected) return this
	this.value = value
	const name = this.getNameFor(value)
	this.nodes.forEach(node => {
		$(node).find('bb-select').text(name)
	})
	if (!this.nodes.includes(this.node)) {
		$(this.node).find('bb-select').text(name)
	}

	if (selected.align === value) return this

	selected.align = value
	selected.updateTextMesh()
	Project!.saved = false
	return this
}

export const TEXT_DISPLAY_SEE_THROUGH_TOGGLE = new Toggle(
	`animated-java:text-display-see-through-toggle`,
	{
		name: translate('tool.text_display.see_through.title'),
		icon: 'check_box_outline_blank',
		description: translate('tool.text_display.see_through.description'),
		condition: TEXT_DISPLAY_CONDITION,
		onChange() {
			if (!Project) return
			const scope = TEXT_DISPLAY_SEE_THROUGH_TOGGLE
			scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
			const selected = TextDisplay.selected.at(0)
			if (!selected) return
			if (selected.seeThrough === TEXT_DISPLAY_SEE_THROUGH_TOGGLE.value) return
			selected.seeThrough = TEXT_DISPLAY_SEE_THROUGH_TOGGLE.value
			selected.updateTextMesh()
			Project!.saved = false
		},
	}
)
TEXT_DISPLAY_SEE_THROUGH_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click()
	return this
}

export const TEXT_DISPLAY_COPY_TEXT_ACTION = new Action(
	`animated-java:text-display-copy-text-action`,
	{
		name: translate('tool.text_display.copy_text.title'),
		icon: 'content_copy',
		description: translate('tool.text_display.copy_text.description'),
		condition: TEXT_DISPLAY_CONDITION,
		click: () => {
			if (!Project) return
			const selected = TextDisplay.selected.at(0)
			if (!selected) return

			try {
				const text = new JsonTextParser({
					minecraftVersion: Project.animated_java.target_minecraft_version,
				})
					.parse(selected.text)
					.toString(true, Project.animated_java.target_minecraft_version)
				clipboard.writeText(text)
				Blockbench.showQuickMessage(translate('tool.text_display.copy_text.copied'), 2000)
			} catch (e) {
				console.error(e)
				Blockbench.showQuickMessage('Failed to copy text to clipboard', 2000)
			}
		},
	}
)
