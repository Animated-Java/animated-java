import type * as vue from 'vue'

interface DialogFormElement {
	label: string
	description?: string
	type:
		| 'text'
		| 'number'
		| 'checkbox'
		| 'select'
		| 'radio'
		| 'textarea'
		| 'vector'
		| 'color'
		| 'file'
		| 'folder'
		| 'save'
		| 'info'
	nocolon?: boolean
	readonly?: boolean
	value?: any
	placeholder?: string
	text?: string
	colorpicker?: any
	min?: number
	max?: number
	step?: number
	height?: number
	options?: object
}

type FormResultValue = string | number | boolean | []

interface ActionInterface {
	name: string
	description?: string
	icon: string
	click: (event: Event) => void
	condition: Condition
}
interface DialogOptions {
	title: string
	id: string
	/**
	 * Default button to press to confirm the dialog. Defaults to the first button.
	 */
	confirmIndex?: number
	/**
	 * Default button to press to cancel the dialog. Defaults to the last button.
	 */
	cancelIndex?: number
	/**
	 *  Function to execute when the user confirms the dialog
	 */
	onConfirm?: (formResult: object) => void
	/**
	 * Function to execute when the user cancels the dialog
	 */
	onCancel?: () => void
	/**
	 * Triggered when the user presses a specific button
	 */
	onButton?: (button_index: number, event?: Event) => void
	/**
	 * Function to run when anything in the form is changed
	 */
	onFormChange?: (form_result: { [key: string]: FormResultValue }) => void
	/**
	 * Array of HTML object strings for each line of content in the dialog.
	 */
	lines?: (string | HTMLElement)[]
	/**
	 * Creates a form in the dialog
	 */
	form?: {
		[formElement: string]: '_' | DialogFormElement
	}
	/**
	 * vue component
	 */
	component?: vue.Component
	/**
	 * Order that the different interface types appear in the dialog. Default is 'form', 'lines', 'component'.
	 */
	part_order?: string[]
	form_first?: boolean
	width: number
	/**
	 * Creates a dialog sidebar
	 */
	sidebar?: DialogSidebarOptions
	/**
	 * Menu in the handle bar
	 */
	title_menu?: Menu
	/**
	 * If true, the dialog will only have one button to close it
	 */
	singleButton?: boolean
	/**
	 * List of buttons
	 */
	buttons?: string[]
}

interface DialogSidebarOptions {
	pages?: {
		[key: string]: string
	}
	page?: string
	actions?: (Action | ActionInterface | string)[]
	onPageSwitch?: (page: string) => void
}
declare class DialogSidebar {
	constructor(options: DialogSidebarOptions)

	pages: {
		[key: string]: string
	}
	page: string
	actions: (Action | string)[]
	onPageSwitch(page: string): void
	build(): void
	toggle(state?: boolean): void
	setPage(page: string): void
}

declare class Dialog {
	constructor(options: DialogOptions)

	id: string
	component: vue.Component
	sidebar: DialogSidebar | null

	show: () => Dialog
	hide: () => Dialog
	/**
	 * Triggers the confirm event of the dialog.
	 */
	confirm: (event?: Event) => void
	/**
	 * Triggers the cancel event of the dialog.
	 */
	cancel: (event?: Event) => void
	/**
	 * Closes the dialog using the index of the pressed button
	 */
	close: (button: number, event?: Event) => void
	/**
	 * If the dialog contains a form, return the current values of the form
	 */
	getFormResult(): {
		[key: string]: FormResultValue
	}
	/**
	 * Set the values of the dialog form inputs
	 */
	setFormValues(values: { [key: string]: FormResultValue }): void
	/**
	 * Delete the dialog object, causing it to be re-build from scratch on next open
	 */
	delete(): void

	/**
	 * Currently opened dialog
	 */
	static open: Dialog | null
}

// TODO Fix up this interaface. Was created quickly to fix TS errors and doesn't have fully accurate typing
interface Interface {
	Panels: { [name: string]: Panel }
	Resizers: { [name: string]: unknown } // FIXME Missing type
	addSuggestedModifierKey: (key: string, text: string) => void
	bottom_panel_height: number
	center_screen: Element // FIXME No idea how DOM elements work lol

	createElement: (
		tag: string,
		attributes: any,
		content: string | string[] | HTMLElement
	) => Element

	data: {
		left_bar: string[]
		left_bar_width: number
		quad_view_x: number
		quad_view_y: number
		right_bar: string[]
		right_bar_width: number
		timeline_head: number
		timeline_height: number
	}

	default_data: {
		left_bar: ['uv', 'textures', 'display', 'animations', 'keyframe', 'variable_placeholders']
		left_bar_width: 366
		panels: {
			paint: {
				float_position: [300, 0]
				float_size: [500, 600]
				height: 490
				slot: 'left_bar'
			}
		}
		quad_view_x: 50
		quad_view_y: 50
		right_bar: ['element', 'bone', 'color', 'skin_pose', 'outliner', 'chat']
		right_bar_width: 314
		timeline_head: 196
	}

	definePanels: (callback: () => void) => void // FIXME Unsure what the callback function's arguments should be
	getBottomPanel: () => Panel | undefined
	getTopPanel: () => Panel | undefined
	getLeftPanel: () => Panel | undefined
	getRightPanel: () => Panel | undefined
	left_bar: Element
	left_bar_width: number
	page_wrapper: Element
	panel_definers: (() => void)[]
	preview: Element
	removeSuggestedModifierKey: (key: string, text: string) => void
	right_bar: Element
	right_bar_width: number
	status_bar: {
		menu: Menu
		vue: vue.Component
	}
	tab_bar: vue.Component
	text_edit_menu: Menu
	toggleSidebar: (side: string | undefined, status: any) => void
	top_panel_height: number
	work_screen: Element
}
