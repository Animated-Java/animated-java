import { isCurrentFormat } from '@aj/blockbench-additions/model-formats/ajblueprint'
import { TextDisplay, type Alignment } from '@aj/blockbench-additions/outliner-elements/textDisplay'
import { PACKAGE } from '@aj/constants'
import { TextDisplayConfig } from '@aj/systems/node-configs'
import { SveltePanel } from '@aj/util/sveltePanel'
import { translate } from '@aj/util/translation'
import DisplayPanel from './displayPanel.svelte'

export type OptionMode = 'default' | 'custom'
export type CommonOptionMode = OptionMode | 'inherit'

export enum MODE_ICONS {
	'default' = 'home',
	'custom' = 'edit',
	'inherit' = 'supervisor_account',
}

export const DISPLAY_PANEL = new SveltePanel({
	id: `${PACKAGE.name}:display_panel`,
	icon: 'visibility',
	default_side: 'right',
	default_position: {
		slot: 'right_bar',
		height: 200,
		float_position: [0, 0],
		float_size: [200, 200],
		folded: false,
	},
	selection_only: true,
	resizable: true,
	insert_after: 'element',
	name: translate('panel.display.title'),
	component: DisplayPanel,
	props: {},
	expand_button: true,
	condition: () => !!(isCurrentFormat() && Mode.selected?.id === 'edit'),
})

// Text Display Element Panel
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
			const config = new TextDisplayConfig().fromJSON(selected.config)
			return config.lineWidth!
		},
		change(value) {
			const selected = TextDisplay.selected[0]
			if (!selected) return
			const config = new TextDisplayConfig().fromJSON(selected.config)
			config.lineWidth = Math.clamp(value(config.lineWidth!), 1, 10000)
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
	const config = new TextDisplayConfig().fromJSON(selected.config)
	return new tinycolor(config.backgroundColor)
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.set = function (this: ColorPicker, color: string) {
	this.value = new tinycolor(color)
	// @ts-expect-error
	this.jq.spectrum('set', this.value.toHex8String())

	const selected = TextDisplay.selected[0]
	if (!selected) return this
	const config = new TextDisplayConfig().fromJSON(selected.config)
	config.backgroundColor = this.value.toHex8String()
	return this
}
TEXT_DISPLAY_BACKGROUND_COLOR_PICKER.change = function (
	this: ColorPicker,
	color: InstanceType<typeof tinycolor>
) {
	const selected = TextDisplay.selected[0]
	if (!selected) return this
	const config = new TextDisplayConfig().fromJSON(selected.config)
	config.backgroundColor = color.toHex8String()
	return this
}

export const TEXT_DISPLAY_SHADOW_TOGGLE = new Toggle(`${PACKAGE.name}:textDisplayShadowToggle`, {
	name: translate('tool.text_display.text_shadow.title'),
	icon: 'check_box_outline_blank',
	description: translate('tool.text_display.text_shadow.description'),
	condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
	click() {
		//
	},
	onChange() {
		const scope = TEXT_DISPLAY_SHADOW_TOGGLE
		scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
		const selected = TextDisplay.selected[0]
		if (!selected) return
		const config = new TextDisplayConfig().fromJSON(selected.config)
		config.shadow = TEXT_DISPLAY_SHADOW_TOGGLE.value
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
	const config = new TextDisplayConfig().fromJSON(selected.config)
	return config.alignment
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
	const config = new TextDisplayConfig().fromJSON(selected.config)
	config.alignment = value
	return this
}

export const TEXT_DISPLAY_SEE_THROUGH_TOGGLE = new Toggle(
	`${PACKAGE.name}:textDisplaySeeThroughToggle`,
	{
		name: translate('tool.text_display.see_through.title'),
		icon: 'check_box_outline_blank',
		description: translate('tool.text_display.see_through.description'),
		condition: () => isCurrentFormat() && !!TextDisplay.selected.length,
		click() {
			//
		},
		onChange() {
			const scope = TEXT_DISPLAY_SEE_THROUGH_TOGGLE
			scope.setIcon(scope.value ? 'check_box' : 'check_box_outline_blank')
			const selected = TextDisplay.selected[0]
			if (!selected) return
			const config = new TextDisplayConfig().fromJSON(selected.config)
			config.seeThrough = TEXT_DISPLAY_SEE_THROUGH_TOGGLE.value
		},
	}
)
TEXT_DISPLAY_SEE_THROUGH_TOGGLE.set = function (value) {
	if (this.value === value) return this
	this.click()
	return this
}
