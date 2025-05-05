import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

/**
 * I want alphabetically ordered format categories.
 */
createBlockbenchMod(
	`${PACKAGE.name}:mods/ui/formatOrder`,
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
