import { registerPatch } from 'blockbench-patch-manager'
import { BLUEPRINT_FORMAT_ID } from '../formats/blueprint'

const GENERAL_CATEGORY_QUERY = `li.format_category:has(li[format="free"])`
const ANIMATED_JAVA_CATEGORY_QUERY = `li.format_category:has(li[format="${BLUEPRINT_FORMAT_ID}"])`

registerPatch({
	id: `animated_java:sort-formats`,

	apply: () => {
		const interval = setInterval(() => {
			const ajFormats = $(ANIMATED_JAVA_CATEGORY_QUERY).first()
			if (ajFormats.length === 0) return

			const mcFormats = $(GENERAL_CATEGORY_QUERY).first()
			if (mcFormats.length === 0) return

			ajFormats.insertAfter(mcFormats)

			clearInterval(interval)
		}, 16)
	},

	revert: () => undefined,
})
