import type { ValidateResourceLocation } from '@aj/util/namespacedId'
import { mount, unmount, type Component, type MountOptions } from 'svelte'
import type { ComponentPropsPatch, GenericComponent } from './helperTypes'

const DIALOG_STACK = new Map<string, SvelteDialog<string>>()

interface ComponentMountOptions<C extends GenericComponent> {
	component: C
	props?: ComponentPropsPatch<C>
	intro?: boolean
	outro?: boolean
	/** Can be accessed via getContext() at the component level */
	context?: MountOptions['context']
}

interface SidebarPage<C extends GenericComponent> extends ComponentMountOptions<C> {
	label: string
	icon: IconString
	/** Whether or not this page should be visible in the sidebar */
	condition?: () => boolean
}

type PageMap = Record<string, SidebarPage<any>>

interface SvelteDialogSidebarOptions<Pages extends PageMap> {
	pages: Pages
	defaultPage?: string
	pageSwitchActions?: DialogSidebarOptions['actions']
	onPageSwitch?: DialogSidebarOptions['onPageSwitch']
}

type SvelteDialogOptions<
	ID extends string,
	TitleC extends GenericComponent,
	FooterC extends GenericComponent,
> = Omit<
	DialogOptions,
	'lines' | 'sidebar' | 'component' | 'form' | 'part_order' | 'form_first' | 'title' | 'id'
> & {
	title: string | ComponentMountOptions<TitleC>
	id: ValidateResourceLocation<ID>
	disableKeybinds?: boolean
	disableConfirmKeybind?: boolean
	disableCancelKeybind?: boolean
	stackable?: boolean
	footer?: ComponentMountOptions<FooterC>
	onClose?: () => void
}

/**
 * Creates a Blockbench Dialog from Svelte Components
 */
export class SvelteDialog<
	ID extends string,
	C extends GenericComponent = Component,
	TitleC extends GenericComponent = Component,
	FooterC extends GenericComponent = Component,
> extends Dialog {
	protected instance?: ReturnType<typeof mount>
	protected anchor: Comment
	protected titleInstance?: ReturnType<typeof mount>
	protected footerInstance?: ReturnType<typeof mount>

	constructor(options: SvelteDialogOptions<ID, TitleC, FooterC> & ComponentMountOptions<C>) {
		const anchor = document.createComment(`svelte-dialog-` + guid())

		// Modify options so they are compatible with Blockbench's DialogOptions
		const dialogOptions = { ...options } as DialogOptions
		if (typeof options.title !== 'string') {
			dialogOptions.title = options.id
		}

		super({
			...(dialogOptions as DialogOptions),
			lines: [anchor],
			component: undefined,
		})

		this.anchor = anchor

		this.onOpen = () => {
			if (!options.stackable) {
				DIALOG_STACK.forEach(v => v.cancel())
				DIALOG_STACK.clear()
			}
			const existingDialog = DIALOG_STACK.get(this.id)
			if (existingDialog) {
				console.warn(
					`An existing instance of dialog "${this.id}" was found and will be closed before opening a new one.`
				)
				existingDialog.cancel()
			}

			DIALOG_STACK.set(this.id, this)

			const target = this.dialogContentElement
			target.style.overflow = 'visible'
			this.instance = mount(options.component, {
				target,
				anchor: this.anchor,
				props: options.props ?? {},
				intro: options.intro,
				context: options.context,
			})

			if (typeof options.title !== 'string') {
				const target = this.dialogHandleElement
				for (const child of Array.from(target.childNodes)) {
					child.remove()
				}
				const titleAnchor = document.createComment(`svelte-dialog-handle-` + guid())
				target.prepend(titleAnchor)
				target.style.height = 'auto'
				target.style.minHeight = '30px'
				this.titleInstance = mount(options.title.component, {
					target,
					anchor: titleAnchor,
					props: options.title.props ?? {},
					intro: options.intro,
					context: options.context,
				})
			}

			if (options.footer) {
				const buttonBar = this.dialogButtonBarElement
				const buttonAnchor = document.createComment(`svelte-dialog-footer-` + guid())
				buttonBar.prepend(buttonAnchor)
				this.footerInstance = mount(options.footer.component, {
					target: buttonBar,
					anchor: buttonAnchor,
					props: options.footer.props ?? {},
					intro: options.intro,
					context: options.context,
				})
			}

			options.onOpen?.()
		}

		const unmountSvelteComponent = () => {
			if (!this.instance) return false
			void unmount(this.instance, { outro: options.outro ?? false })
			this.instance = undefined
			return true
		}

		this.confirm = (e: Event) => {
			if (e instanceof KeyboardEvent) {
				switch (true) {
					case options.disableKeybinds:
					case options.disableConfirmKeybind &&
						e.key === Keybinds.extra.confirm.keybind.getCode():
					case options.disableCancelKeybind &&
						e.key === Keybinds.extra.cancel.keybind.getCode():
						e.preventDefault()
						e.stopPropagation()
						return
				}
			}
			this.close(this.confirmIndex, e)
		}

		this.onButton = (...args) => {
			if (!unmountSvelteComponent()) return
			options.onButton?.(...args)
			options.onClose?.()
		}

		this.onCancel = (...args) => {
			if (!unmountSvelteComponent()) return
			options.onCancel?.(...args)
			options.onClose?.()
		}
	}

	get dialogContentElement() {
		const element = this.anchor.parentElement
		if (!element) {
			throw new Error('Failed to get dialog content element: Anchor element has no parent')
		}
		return element as HTMLDivElement
	}

	get dialogHandleElement() {
		const element =
			this.dialogContentElement.parentElement?.parentElement?.querySelector('.dialog_handle')
		if (!element) {
			throw new Error('Failed to get dialog handle element: .dialog_handle not found')
		}
		return element as HTMLDivElement
	}

	get dialogButtonBarElement() {
		const element = this.dialogContentElement.parentElement?.querySelector('.button_bar')
		if (!element) {
			throw new Error('Failed to get dialog button bar element: .button_bar not found')
		}
		return element as HTMLDivElement
	}
}

/**
 * Creates a Blockbench Dialog with a sidebar from Svelte Components
 */
export class SvelteDialogSidebar<
	ID extends string,
	Pages extends PageMap,
	TitleC extends GenericComponent = Component,
	FooterC extends GenericComponent = Component,
> extends SvelteDialog<ID, GenericComponent, TitleC, FooterC> {
	protected pages: Pages
	protected defaultPage: string

	constructor(
		options: SvelteDialogOptions<ID, TitleC, FooterC> & SvelteDialogSidebarOptions<Pages>
	) {
		const customOnPageSwitch = options.onPageSwitch
		const switchPage = (page: string) => {
			const target = this.dialogContentElement
			target.style.overflow = 'visible'
			const pageData = this.pages?.[page]
			if (!pageData) {
				console.error(
					`Attempted to switch pages to unknown page "${page}" in "${options.id}" dialog`
				)
				return
			}
			if (this.instance) {
				// Resolves immediately when outro is false
				void unmount(this.instance, { outro: false })
			}
			this.instance = mount(pageData.component, {
				target,
				anchor: this.anchor,
				props: pageData.props,
				intro: false,
				context: pageData.context,
			})
			customOnPageSwitch?.(page)
		}

		if (Object.keys(options.pages).length === 0) {
			throw new Error('Attempted to create a sidebar dialog with no pages')
		}

		const defaultPage = options.defaultPage ?? Object.keys(options.pages)[0]
		const vanillaDialogOptions = omitKeys({ ...options }, ['sidebar'])

		const conditionIntervalId = setInterval(() => {
			for (const [key, other] of Object.entries(this.pages)) {
				if (other.condition === undefined) continue
				this.sidebar!.page_menu[key].style.display = Condition(other.condition)
					? ''
					: 'none'
			}
		}, 1000 / 60)

		super({
			...vanillaDialogOptions,
			// @ts-expect-error
			sidebar: {
				pages: options.pages,
				page: defaultPage,
				onPageSwitch: switchPage,
				actions: options.pageSwitchActions,
			},
			component: options.pages[defaultPage].component,
			props: options.pages[defaultPage].props,
			onButton(...args) {
				clearInterval(conditionIntervalId)
				options.onButton?.(...args)
			},
			onCancel(...args) {
				clearInterval(conditionIntervalId)
				options.onCancel?.(...args)
			},
		})
		this.pages = options.pages
		this.defaultPage = defaultPage
	}
}
