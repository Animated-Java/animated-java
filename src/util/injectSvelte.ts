import { SvelteComponent } from 'svelte'
import { pollPromise } from './promises'
import { createBlockbenchMod } from '../util/moddingTools'
import { SvelteComponentDev } from 'svelte/internal'

export function injectSvelteCompomponent(options: {
	// @ts-ignore
	svelteComponent: SvelteComponentConstructor<SvelteComponent, any>
	svelteComponentProperties: Record<string, any>
	/**
	 * A function that returns the element to inject the svelte component into.
	 */
	elementSelector: () => Element | undefined | null
	prepend?: boolean
	postMount?: (comp: SvelteComponentDev) => void
	injectIndex?: number
}) {
	void pollPromise(options.elementSelector).then(el => {
		let anchor = undefined
		if (options.prepend) {
			anchor = el.children[0]
		} else if (options.injectIndex !== undefined) {
			anchor = el.children[options.injectIndex]
		}
		const component = new options.svelteComponent({
			target: el,
			anchor,
			props: options.svelteComponentProperties,
		})
		if (options.postMount) options.postMount(component as SvelteComponentDev)
	})
}

export function injectSvelteCompomponentMod(options: {
	// @ts-ignore
	svelteComponent: SvelteComponentConstructor<SvelteComponent, any>
	svelteComponentProperties: Record<string, any>
	elementSelector: () => Element | undefined | null
	prepend?: boolean
	postMount?: (el: Element) => void
}) {
	createBlockbenchMod(
		`animated_java:injected_svelte_component[${
			options.svelteComponent.name as string
		}](${guid()})`,
		{},
		() => {
			let instance: SvelteComponent | undefined
			void pollPromise(options.elementSelector).then(el => {
				let anchor = undefined
				if (options.prepend) {
					anchor = el.children[0]
				}
				instance = new options.svelteComponent({
					target: el,
					anchor,
					props: options.svelteComponentProperties,
				})
				if (options.postMount) options.postMount(el)
			})
			return instance
		},
		context => {
			if (context) context.$destroy()
		}
	)
}
