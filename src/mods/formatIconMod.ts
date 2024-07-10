import Icon from '../components/icon.svelte'
import { injectSvelteCompomponent } from '../util/injectSvelte'

void injectSvelteCompomponent({
	elementSelector: () => document.querySelector('[format=animated_java_blueprint]'),
	svelteComponent: Icon,
	svelteComponentProperties: {},
	prepend: true,
	postMount: () => {
		document.querySelector('[format=animated_java_blueprint] span i')?.parentElement?.remove()
	},
})
