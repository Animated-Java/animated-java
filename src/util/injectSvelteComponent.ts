import type { SvelteComponentConstructor } from './misc'
import type { ComponentConstructorOptions, SvelteComponentDev } from 'svelte/internal'
import { pollPromise } from './promises'
import { createBlockbenchMod } from './moddingTools'

type InjectSvelteComponentOptions<T, U extends ComponentConstructorOptions> = {
	/**
	 * The svelte component constructor.
	 */
	component: SvelteComponentConstructor<T, U>
	/**
	 * The props to pass to the component
	 */
	props: U['props']
	/**
	 * A function that returns the element to inject the component into.
	 *
	 * This function will be polled until it returns a non-null value.
	 * @returns The element to inject the component into
	 */
	elementSelector: () => Element | undefined | null
	/**
	 * A function to call after the component has been mounted
	 * @param comp The mounted svelte component
	 */
	postMount?: (comp: SvelteComponentDev) => void
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
 * Injects a svelte component into the DOM.
 */
export async function injectSvelteCompomponent<T, U extends Record<string, any>>(
	options: InjectSvelteComponentOptions<T, ComponentConstructorOptions<U>>
) {
	return pollPromise(options.elementSelector).then(el => {
		let anchor = undefined
		if (options.prepend) {
			anchor = el.children[0]
		} else if (options.injectIndex !== undefined) {
			anchor = el.children[options.injectIndex]
		}
		const component = new options.component({
			target: el,
			anchor,
			props: options.props,
		}) as SvelteComponentDev
		if (options.postMount) options.postMount(component)
		return component
	})
}

export function injectSvelteCompomponentMod(options: InjectSvelteComponentOptions<any, any>) {
	createBlockbenchMod(
		`animated_java:injected_svelte_component[${options.component.name}](${guid()})`,
		{},
		() => {
			let instance: SvelteComponentDev | undefined
			void pollPromise(options.elementSelector).then(el => {
				let anchor = undefined
				if (options.prepend) {
					anchor = el.children[0]
				}
				instance = new options.component({
					target: el,
					anchor,
					props: options.props,
				})
				if (options.postMount) options.postMount(instance!)
			})
			return instance
		},
		context => {
			if (context) context.$destroy()
		}
	)
}
