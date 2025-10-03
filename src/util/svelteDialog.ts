import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte'

const DIALOG_STACK: Array<SvelteDialog> = []

type CssStyleObject = {
	[K in keyof CSSStyleDeclaration as K extends string
		? CSSStyleDeclaration[K] extends string
			? K
			: never
		: never]?: CSSStyleDeclaration[K]
}

type SvelteComponentOptions<T extends SvelteComponent> = ComponentProps<T> extends Record<
	string,
	never
>
	? {
			component: ComponentType<T>
			props?: ComponentProps<T>
	  }
	: {
			component: ComponentType<T>
			props: ComponentProps<T>
	  }

type SvelteDialogOptions<
	DialogContent extends SvelteComponent,
	DialogExtra extends SvelteComponent
> = Omit<DialogOptions, 'lines' | 'component'> & {
	id: string
	content: SvelteComponentOptions<DialogContent>
	/** A svelte component to be appended directly to the dialog.dialog element. */
	extra?: SvelteComponentOptions<DialogExtra>

	/** Styles to be applied to the default content element */
	contentStyle?: CssStyleObject
	/** Styles to be applied to the default wrapper element */
	wrapperStyle?: CssStyleObject
	/** Styles to be applied to the dialog element */
	dialogStyle?: CssStyleObject

	preventKeybinds?: boolean
	preventKeybindConfirm?: boolean
	preventKeybindCancel?: boolean
	onClose?: () => void
	stackable?: boolean
}

function applyStyleObject(element: HTMLElement, style: CssStyleObject) {
	for (const [key, value] of Object.entries(style)) {
		// @ts-expect-error - Index type of CSSStyleDeclaration is number for some reason
		element.style[key] = value ?? ''
	}
}

export class SvelteDialog<
	DialogContent extends SvelteComponent = any,
	DialogExtra extends SvelteComponent = any
> extends Dialog {
	wrapperElement?: HTMLDivElement
	contentElement?: HTMLDivElement

	contentComponent?: SvelteComponent<DialogContent>
	extraComponent?: SvelteComponent<DialogExtra>

	constructor(options: SvelteDialogOptions<DialogContent, DialogExtra>) {
		const mount = document.createComment(`svelte-dialog-` + guid())

		const dialogOptions = { ...options }
		// @ts-expect-error
		delete dialogOptions.component

		super(options.id, {
			...dialogOptions,
			lines: [mount],
		})

		this.onOpen = () => {
			if (this.contentComponent) return

			this.contentElement = mount.parentElement! as HTMLDivElement
			if (!this.contentElement) {
				console.error('Failed to find dialog content element')
				return
			}

			this.wrapperElement = this.contentElement.parentElement! as HTMLDivElement
			if (!this.wrapperElement) {
				console.error('Failed to find dialog wrapper element')
				return
			}

			if (options.contentStyle) applyStyleObject(this.contentElement, options.contentStyle)
			if (options.wrapperStyle) applyStyleObject(this.wrapperElement, options.wrapperStyle)
			if (options.dialogStyle) applyStyleObject(this.object!, options.dialogStyle)

			this.contentComponent = new options.content.component({
				target: this.contentElement,
				props: options.content.props,
			})

			if (options.extra) {
				this.extraComponent = new options.extra.component({
					target: this.object!,
					props: options.extra.props,
				})
			}

			if (options.onOpen) options.onOpen()
			if (!options.stackable) {
				DIALOG_STACK.forEach(v => v.cancel())
				DIALOG_STACK.empty()
			}
			DIALOG_STACK.push(this)

			requestAnimationFrame(() => {
				// Center the dialog vertically, but shifted a bit upwards
				const jqObject = $(this.object!)
				const height = jqObject.height()!
				const diff = Math.max(window.innerHeight - height, 0)
				const offset = diff * 0.25
				this.object!.style.top = Math.clamp(diff / 2 - offset, 26, 2000) + 'px'
			})
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
			if (!this.contentComponent) return
			this.extraComponent?.$destroy()
			this.contentComponent.$destroy()
			this.contentComponent = undefined
			if (options.onButton) options.onButton(...args)
			if (options.onClose) options.onClose()
		}

		this.onCancel = (...args) => {
			if (!this.contentComponent) return
			this.extraComponent?.$destroy()
			this.contentComponent.$destroy()
			this.contentComponent = undefined
			if (options.onCancel) options.onCancel(...args)
			if (options.onClose) options.onClose()
		}
	}
}
