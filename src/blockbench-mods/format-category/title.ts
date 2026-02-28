import { AJBLUEPRINT_FORMAT } from '@aj/formats/ajblueprint'
import Icon from '@aj/formats/ajblueprint/icon.svelte'
import { injectComponent } from '@aj/svelte/injectComponent'
import { localize } from '@aj/util/lang'
import { createGenericPatch } from '@aj/util/moddingTools'
import { unmount } from 'svelte'

Language.data['format_category.animated_java'] = localize('format_category.animated_java')

createGenericPatch({
	id: 'animated-java:format-category-title',
	collectContext: () => ({}),
	apply: () => {
		return injectComponent({
			component: Icon,
			elementSelector() {
				const el = document.querySelector<HTMLDivElement>(
					`li[format="${AJBLUEPRINT_FORMAT.id}"]`
				)
				if (!el) return
				const span = el.querySelector('span')
				if (!span) return
				span.remove()
				return el
			},
		})
	},
	revert: async ctx => {
		await unmount(await ctx)
	},
})
