interface DialogFormElement {
	label: string
	description?: string
	type: 'text' | 'number' | 'checkbox' | 'select' | 'radio' | 'textarea' | 'vector' | 'color' | 'file' | 'folder' | 'save' | 'info'
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

type FormResultValue = string|number|boolean|[]

interface ActionInterface {
	name: string
	description?: string
	icon: string,
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
	onFormChange?: (form_result: {[key: string]: FormResultValue}) => void
	/**
	 * Array of HTML object strings for each line of content in the dialog.
	 */
	lines?: (string|HTMLElement)[]
	/**
	 * Creates a form in the dialog
	 */
	form?: {
		[formElement: string]: '_' | DialogFormElement
	}
	/**
	 * Vue component
	 */
	component?: Vue.Component
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
	actions?: (Action|ActionInterface|string)[],
	onPageSwitch?: (page: string) => void
}
declare class DialogSidebar {
	constructor(options: DialogSidebarOptions)

	pages: {
		[key: string]: string
	}
	page: string
	actions: (Action|string)[]
	onPageSwitch(page: string): void
	build(): void
	toggle(state?: boolean): void
	setPage(page: string): void
}

declare class Dialog {
	constructor (options: DialogOptions)

	id: string
	component: Vue.Component
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
	setFormValues(values: {[key: string]: FormResultValue}): void
	/**
	 * Delete the dialog object, causing it to be re-build from scratch on next open
	 */
	delete(): void

	/**
	 * Currently opened dialog
	 */
	static open: Dialog | null
}
