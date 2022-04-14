declare const BarItems: {
	[id: string]:
		| Action
		| Toggle
		| BarSelect
		| BarSlider
		| BarText
		| ColorPicker
		| NumSlider
		| Widget
		| Tool
		| BarItem
}

declare interface KeybindKeys {
	/**
	 * Main key, can be a numeric keycode or a lower case character
	 */
	key: number | string
	ctrl?: boolean | null
	shift?: boolean | null
	alt?: boolean | null
	meta?: boolean | null
}
declare class Keybind {
	constructor(keys: KeybindKeys)
}
interface KeybindItemOptions {
	keybind?: Keybind
}
declare class KeybindItem extends Deletable {
	constructor(id: string, options: KeybindItemOptions)
}

declare class MenuSeparator {
	constructor()
}
interface BarItemOptions extends KeybindItemOptions {
	name?: string
	description?: string
	icon: string
	condition?: any
	category?: string
	keybind?: Keybind
}
declare class BarItem extends KeybindItem {
	id: string
	name: string
	description: string
	constructor(id: string, options: BarItemOptions)
	conditionMet(): boolean
	addLabel(in_bar: any, action: any): void
	getNode(): HTMLElement
	toElement(destination: HTMLElement): this
	pushToolbar(bar: any): void
}

interface ActionOptions extends BarItemOptions {
	click(event: Event): void
	color?: string
	linked_setting?: string
	children?: object[]
	/**
	 * Show the full label in toolbars
	 */
	label?: boolean
}
declare class Action extends BarItem {
	constructor(id: string, options: ActionOptions)
	trigger(event: Event): boolean
	updateKeybindingLabel(): this
	setIcon(icon: string): void
	toggleLinkedSetting(change: any): void
	nodes: HTMLElement[]
}

interface ToggleOptions extends BarItemOptions {
	onChange(value: boolean): void
}

declare class Toggle extends BarItem {
	constructor(id: string, options: ToggleOptions)
	onChange(value: boolean): void
}

interface ToolOptions extends ActionOptions {
	selectFace?: boolean
	transformerMode?: 'translate' | ''
	animation_channel?: string
	toolbar?: string
	alt_tool?: string
	modes?: string[]
}
declare class Tool extends Action {
	constructor(id: string, options: ToolOptions)
	select(): this | undefined
	trigger(event: Event): boolean
}
declare class Widget extends BarItem {
	constructor(id: string, options: object)
}
declare class NumSlider extends Widget {
	constructor(id: string, options: object)
	startInput(event: Event): void
	setWidth(width: any): this
	getInterval(event: Event): any
	slide(clientX: any, event: Event): void
	input(): void
	stopInput(): void
	arrow(difference: any, event: Event): void
	trigger(event: Event): boolean
	setValue(value: number, trim: any): this
	change(modify: any): void
	get(): any
	update(): void
}
declare class BarSlider extends Widget {
	constructor(id: string, options: object)
	change(event: Event): void
	set(value: any): void
	get(): any
}
declare class BarSelect extends Widget {
	constructor(id: string, options: object)
	open(event: Event): void
	trigger(event: Event): boolean | undefined
	change(event: Event): this
	getNameFor(key: any): any
	set(key: any): this
	get(): any
}
declare class BarText extends Widget {
	constructor(id: string, options: object)
	set(text: any): this
	update(): this
	trigger(event: Event): boolean
}
declare class ColorPicker extends Widget {
	constructor(id: string, options: object)
	change(color: any): void
	hide(): void
	confirm(): void
	set(color: any): this
	get(): any
}
declare class Toolbar {
	constructor(data: any)
	build(data: any, force: any): this
	contextmenu(event: Event): void
	editMenu(): this
	add(action: any, position: any): this
	remove(action: any): this
	update(): this
	toPlace(place: any): this
	save(): this
	reset(): this
}

declare const Toolbars: {
	[index: string]: Toolbar
}

declare namespace BARS {
	const stored: { [index: string]: string[] }
	const editing_bar: undefined | Toolbar
	const action_definers: (() => void)[]
	const condition: any
	function defineActions(definer: any): void
	function setupActions(): void
	function setupToolbars(): void
	function setupVue(): void
	function updateConditions(): void
	function updateToolToolbar(): void
}
declare namespace ActionControl {
	const open: boolean
	const type: string
	const max_length: number
	function select(): void
	function hide(): void
	function confirm(event: Event): void
	function cancel(): void
	function trigger(action: any, event: Event): void
	function click(action: any, event: Event): void
	function handleKeys(event: Event): boolean
}
declare namespace Keybinds {
	const actions: BarItem[]
	const stored: {}
	const extra: {}
	const structure: {}
	function save(): void
	function reset(): void
}
