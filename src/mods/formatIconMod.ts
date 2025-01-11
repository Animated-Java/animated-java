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

createBlockbenchMod(
	`${PACKAGE.name}:prioritizeAnimatedJavaFormats`,
	undefined,
	() => {
		const interval = setInterval(() => {
			const ajFormats = $("li.format_category > label:contains('Animated Java')")
				.first()
				.parent()
			if (ajFormats.length === 0) return

			const mcFormats = $("li.format_category > label:contains('General')").first().parent()

			ajFormats.insertBefore(mcFormats)

			clearInterval(interval)
		}, 16)
	},
	() => {
		// Pass
	}
)
