import { BLUEPRINT_FORMAT_ID } from 'src/formats/blueprint/format'
import { registerMod } from 'src/util/moddingTools'
import Icon from '../components/icon.svelte'
import { injectSvelteComponent } from '../util/injectSvelteComponent'

registerMod({
	id: `aniamted-java:format-icon`,

	apply: () => {
		void injectSvelteComponent({
			elementSelector: () => document.querySelector(`li[format="${BLUEPRINT_FORMAT_ID}"]`),
			component: Icon,
			props: {},
			prepend: true,
			postMount: () => {
				document
					.querySelector(`li[format="${BLUEPRINT_FORMAT_ID}"] span i`)
					?.parentElement?.remove()
				const duplicates = [...document.querySelectorAll('#animated_java\\:icon')]
				if (duplicates.length > 1) {
					duplicates.slice(1).forEach(d => d.remove())
				}
			},
		})
	},

	revert: () => {
		document.querySelector('#animated_java\\:icon')?.remove()
	},
})

registerMod({
	id: `animated-java:prioritize-animated-java-formats`,

	apply: () => {
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

	revert: () => {
		// Nothing to do here. The AJ format list entry will be deleted when AJ is unloaded.
	},
})
