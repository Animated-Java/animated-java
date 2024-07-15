import type { ComponentConstructorOptions } from 'svelte'
import type { SvelteComponentDev } from 'svelte/internal'
import type { SvelteComponentConstructor } from './misc'

const DIALOG_STACK: Array<SvelteDialog<unknown, any>> = []

type SvelteDialogOptions<T, U extends ComponentConstructorOptions> = Omit<
	DialogOptions,
	'lines'
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
		delete dialogOptions.component

		super(options.id, {
			...dialogOptions,
			lines: [mount],
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
