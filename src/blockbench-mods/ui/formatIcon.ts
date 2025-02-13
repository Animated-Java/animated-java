import Icon from '@svelte-components/icon.svelte'
import { PACKAGE } from '../../constants'
import { injectSvelteCompomponent } from '../../util/injectSvelteComponent'
import { createBlockbenchMod } from '../../util/moddingTools'

/**
 * Adds an icon to the format category title.
 */
createBlockbenchMod(
	`${PACKAGE.name}:mods/ui/formatIcon`,
	undefined,
	() => {
		void injectSvelteCompomponent({
			elementSelector: () => document.querySelector('[format=animated_java_blueprint]'),
			component: Icon,
			props: {},
			prepend: true,
			postMount: () => {
				document
					.querySelector('[format=animated_java_blueprint] span i')
					?.parentElement?.remove()
				const duplicates = [...document.querySelectorAll('#animated_java\\:icon')]
				if (duplicates.length > 1) {
					duplicates.slice(1).forEach(d => d.remove())
				}
			},
		})
	},
	() => {
		document.querySelector('#animated_java\\:icon')?.remove()
	}
)
