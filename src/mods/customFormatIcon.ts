import { BLUEPRINT_FORMAT_ID } from 'src/formats/blueprint'
import { registerMod } from 'src/util/moddingTools'
import Icon from '../components/icon.svelte'
import { registerMountSvelteComponentMod } from '../util/mountSvelteComponent'

registerMountSvelteComponentMod({
	id: 'animated-java:injected-svelte/format-icon',
	component: Icon,
	target: `li[format="${BLUEPRINT_FORMAT_ID}"] span`,
	replaceChildren: true,
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
