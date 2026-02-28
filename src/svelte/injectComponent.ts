import { awaitResult } from '@aj/util/promises'
import { mount, unmount, type Component } from 'svelte'
import type { ComponentMountOptions } from './helperTypes'

interface InjectSvelteComponentOptions<C extends Component<any, any>, E extends HTMLElement>
	extends ComponentMountOptions<C> {
	/**
	 * A function that returns the element to inject the component into.
	 *
	 * This function will be polled until it returns a non-null value.
	 * @returns The element to inject the component into
	 */
	elementSelector: () => E | undefined | null
	/**
	 * A function to call after the component has been mounted
	 * @param component The mounted svelte component
	 */
	postMount?: (component: ReturnType<typeof mount>, target: E) => void
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

type UnmountCallback = () => void

/**
 * Injects a svelte component into the DOM.
 */
export async function injectComponent<C extends Component<any, any>, E extends HTMLElement>(
	options: InjectSvelteComponentOptions<C, E>
): Promise<UnmountCallback> {
	const target = await awaitResult(options.elementSelector)
	const anchor = document.createComment(`injected-svelte-component-` + guid())

	if (options.prepend) {
		target.insertBefore(anchor, target.firstChild)
	} else if (options.injectIndex !== undefined) {
		target.insertBefore(anchor, target.children[options.injectIndex] || null)
	} else {
		target.appendChild(anchor)
	}

	const mountResult = mount(options.component, {
		target,
		anchor,
		props: options.props,
		intro: options.intro,
		context: options.context,
	})

	if (options.postMount) options.postMount(mountResult, target)

	return async () => {
		await unmount(mountResult, { outro: options.outro })
		anchor.remove()
	}
}
