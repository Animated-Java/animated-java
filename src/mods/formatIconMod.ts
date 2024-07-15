import Icon from '../components/icon.svelte'
import { PACKAGE } from '../constants'
import { injectSvelteCompomponent } from '../util/injectSvelteComponent'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:formatIconMod`,
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
			},
		})
	},
	() => {
		document.querySelector('#animated_java\\:icon')?.remove()
	}
)
