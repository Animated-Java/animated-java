import type { ComponentConstructorOptions } from 'svelte'
import type { SvelteComponentDev } from 'svelte/internal'
import type { SvelteComponentConstructor } from './misc'

const DIALOG_STACK: Array<SvelteDialog<unknown, any>> = []

type SvelteDialogOptions<T, U extends ComponentConstructorOptions> = Omit<
	DialogOptions,
	'lines' | 'sidebar' | 'component'
> & {
	id: string
	component: SvelteComponentConstructor<T, U>
	props: U['props']
	preventKeybinds?: boolean
	preventKeybindConfirm?: boolean
	preventKeybindCancel?: boolean
	onClose?: () => void
	stackable?: boolean
}

export class SvelteDialog<T, U extends Record<string, any>> extends Dialog {
	instance?: SvelteComponentDev | undefined
	constructor(options: SvelteDialogOptions<T, ComponentConstructorOptions<U>>) {
		const mount = document.createComment(`svelte-dialog-` + guid())

		const dialogOptions = { ...options }
		super({
			...dialogOptions,
			lines: [mount],
			component: undefined,
		})

		this.onOpen = () => {
			const parentElement = mount.parentElement
			if (this.instance || !parentElement) return
			parentElement.style.overflow = 'visible'
			// @ts-ignore
			this.instance = new options.component({
				target: parentElement,
				props: options.props,
			})
			if (options.onOpen) options.onOpen()
			if (!options.stackable) {
				DIALOG_STACK.forEach(v => v.cancel())
				DIALOG_STACK.empty()
			}
			DIALOG_STACK.push(this)
		}

		this.confirm = (e: Event) => {
			if (e instanceof KeyboardEvent) {
				if (options.preventKeybinds) {
					e.preventDefault()
					e.stopPropagation()
					return
				} else if (
					options.preventKeybindConfirm &&
					e.key === Keybinds.extra.confirm.keybind.getCode()
				) {
					e.preventDefault()
					e.stopPropagation()
					return
				} else if (
					options.preventKeybindCancel &&
					e.key === Keybinds.extra.cancel.keybind.getCode()
				) {
					e.preventDefault()
					e.stopPropagation()
					return
				}
			}
			this.close(this.confirmIndex, e)
		}

		this.onButton = (...args) => {
			if (!this.instance) return
			this.instance.$destroy()
			this.instance = undefined
			if (options.onButton) options.onButton(...args)
			if (options.onClose) options.onClose()
		}

		this.onCancel = (...args) => {
			if (!this.instance) return
			this.instance.$destroy()
			this.instance = undefined
			if (options.onCancel) options.onCancel(...args)
			if (options.onClose) options.onClose()
		}
	}
}

interface SidebarDialogPage<T, U extends ComponentConstructorOptions> {
	icon: string
	label: string
	component: SvelteComponentConstructor<T, U>
	props: U['props']
	condition?: () => boolean
}

interface SidebarDialogOptions<T, U extends ComponentConstructorOptions>
	extends DialogSidebarOptions {
	pages: Record<string, SidebarDialogPage<T, U>>
	defaultPage?: string
	onPageSwitch?(page: string): void
}

type SvelteSidebarDialogOptions = Omit<DialogOptions, 'lines' | 'sidebar'> & {
	id: string
	sidebar: SidebarDialogOptions<any, any>
	preventKeybinds?: boolean
	preventKeybindConfirm?: boolean
	preventKeybindCancel?: boolean
	onClose?: () => void
	stackable?: boolean
}

export class SvelteSidebarDialog extends Dialog {
	instance?: SvelteComponentDev | undefined
	pages: Record<string, SidebarDialogPage<any, any>>
	defaultPage: string

	private conditionInterval: ReturnType<typeof setInterval>

	constructor(options: SvelteSidebarDialogOptions) {
		const mount = document.createComment(`svelte-dialog-` + guid())

		const dialogOptions = { ...options }

		const userOnPageSwitch = options.sidebar.onPageSwitch
		options.sidebar.onPageSwitch = (page: string) => {
			this.instance?.$destroy()
			this.instance = new this.pages[page].component({
				target: mount.parentElement,
				props: this.pages[page].props,
			}) as SvelteComponentDev

			userOnPageSwitch?.(page)
		}

		super(options.id, {
			...dialogOptions,
			lines: [mount],
			component: undefined,
		})

		this.conditionInterval = setInterval(() => {
			for (const [key, other] of Object.entries(this.pages)) {
				if (other.condition === undefined) continue
				this.sidebar!.page_menu[key].style.display = other.condition?.() ? '' : 'none'
			}
		}, 1000 / 60)

		this.pages = options.sidebar.pages

		if (Object.keys(this.pages).length === 0) {
			throw new Error('No pages provided for sidebar dialog!')
		}

		this.defaultPage = Object.keys(options.sidebar.pages)[0]
		if (options.sidebar.defaultPage) {
			this.defaultPage = options.sidebar.defaultPage
		}

		this.onOpen = () => {
			const parentElement = mount.parentElement
			if (this.instance || !parentElement) return
			parentElement.style.overflow = 'visible'

			this.sidebar!.onPageSwitch(this.defaultPage)

			if (options.onOpen) options.onOpen()
			if (!options.stackable) {
				DIALOG_STACK.forEach(v => v.cancel())
				DIALOG_STACK.empty()
			}
			DIALOG_STACK.push(this)
		}

		this.confirm = (e: Event) => {
			if (e instanceof KeyboardEvent) {
				if (options.preventKeybinds) {
					e.preventDefault()
					e.stopPropagation()
					return
				} else if (
					options.preventKeybindConfirm &&
					e.key === Keybinds.extra.confirm.keybind.getCode()
				) {
					e.preventDefault()
					e.stopPropagation()
					return
				} else if (
					options.preventKeybindCancel &&
					e.key === Keybinds.extra.cancel.keybind.getCode()
				) {
					e.preventDefault()
					e.stopPropagation()
					return
				}
			}
			this.close(this.confirmIndex, e)
		}

		this.onButton = (...args) => {
			if (!this.instance) return
			this.instance.$destroy()
			this.instance = undefined
			if (options.onButton) options.onButton(...args)
			if (options.onClose) options.onClose()
		}

		this.onCancel = (...args) => {
			if (!this.instance) return
			this.instance.$destroy()
			this.instance = undefined
			if (options.onCancel) options.onCancel(...args)
			if (options.onClose) options.onClose()
		}

		console.log(this)
	}
}
