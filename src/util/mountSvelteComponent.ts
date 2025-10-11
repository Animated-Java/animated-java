import { ComponentProps, SvelteComponent } from 'svelte'
import { BaseModOptions, registerMod } from './moddingTools'
import { PollingCancelledError, pollUntilResult } from './promises'
import { SvelteComponentOptions } from './svelteUtil'

type ElementSelector = string | (() => Element | undefined | null)

type MountSvelteComponentOptions<T extends SvelteComponent> = SvelteComponentOptions<T> & {
	/**
	 * A selector string, function returning an element, or the element itself to mount the component to.
	 */
	target: Element | ElementSelector
	/**
	 * If this condition returns true, mounting process will be cancelled.
	 */
	cancelCondition?: () => boolean
	/**
	 * Whether to hide the target element's children when mounting the component.
	 *
	 * Useful when other code is relying on the children being present, but you want to hide them.
	 */
	hideTargetChildren?: boolean
	/**
	 * Whether to replace all children of the target element with the component.
	 */
	replaceChildren?: boolean
	/**
	 * A function to call after the component has been mounted
	 */
	onMount?: (component: T, target: Element) => void
	/**
	 * A function to call before the component is destroyed
	 */
	onDestroy?: (component: T) => void
	/**
	 * Whether to prepend the component to the element's children.
	 *
	 * Overrides `injectIndex` if true.
	 */
	prepend?: boolean
	/**
	 * The index to inject the component at in the element's children.
	 */
	injectIndex?: number
}

/**
 * Mounts a Svelte component to a target element.
 */
export function mountSvelteComponent<T extends SvelteComponent>(
	options: MountSvelteComponentOptions<T>
) {
	let target: Element | undefined | null
	if (typeof options.target === 'string') {
		target = document.querySelector(options.target)
	} else if (typeof options.target === 'function') {
		target = options.target()
	} else {
		target = options.target
	}

	if (!target) throw new Error('Target element not found')

	let anchor: Element | undefined
	if (options.replaceChildren) {
		target.replaceChildren()
	} else {
		if (options.hideTargetChildren) {
			for (const child of Array.from(target.children)) {
				if (child instanceof HTMLElement) {
					child.style.display = 'none'
				}
			}
		}

		if (options.prepend) {
			anchor = target.children[0]
		} else if (options.injectIndex !== undefined) {
			anchor = target.children[options.injectIndex]
		}
	}

	const mounted = new options.component({ target: target, anchor, props: options.props })
	options.onMount?.(mounted, target)

	mounted.$on('destroy', () => {
		options.onDestroy?.(mounted)
	})

	return mounted
}

type MountSvelteComponentModOptions<
	ID extends string,
	T extends SvelteComponent
> = BaseModOptions<ID> &
	Omit<MountSvelteComponentOptions<T>, 'target'> & {
		target: ElementSelector
	}

export function registerMountSvelteComponentMod<ID extends string, T extends SvelteComponent>(
	options: MountSvelteComponentModOptions<ID, T>
) {
	const mountSelector =
		typeof options.target === 'string'
			? document.querySelector.bind(document, options.target)
			: options.target

	let mounted: T | undefined

	const destroy = () => {
		if (mounted != undefined) {
			options.onDestroy?.(mounted)
			mounted?.$destroy()
			mounted = undefined
		}
	}

	const modHandle = registerMod({
		...options,

		apply: () => {
			destroy()

			void pollUntilResult(
				() => mountSelector(),
				// Prioritize cancelling if the mod is uninstalled while waiting.
				() => !modHandle.isInstalled() || !!options.cancelCondition?.()
			)
				.then(target => {
					mounted = mountSvelteComponent({
						...(options as typeof options & { props: ComponentProps<T> }),
						target,
					})
				})
				.catch(e => {
					if (e instanceof PollingCancelledError) {
						console.warn('Mounting Svelte component cancelled for mod', options.id)
						return
					} else throw e
				})
		},

		revert: destroy,
	})

	return modHandle
}
