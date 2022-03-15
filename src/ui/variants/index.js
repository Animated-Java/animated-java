import { format } from '../../modelFormat'
import { bus } from '../../util/bus'
import { PLUGIN } from '../../constants/events'
import { tl } from '../../util/intl'
export const VARIANTS_MODE_ID = 'animated-java-variants'
const $originalBarUpdate = BarItems.cube_counter.onUpdate
BarItems.cube_counter.onUpdate = function () {
	if (Animator.open || Mode.selected?.id === VARIANTS_MODE_ID) {
		var sel = 0
		if (Group.selected) {
			Group.selected.forEachChild((_) => sel++, Group, true)
		}
		this.set(
			stringifyLargeInt(sel) + ' / ' + stringifyLargeInt(Group.all.length)
		)
	} else {
		this.set(
			stringifyLargeInt(Outliner.selected.length) +
				' / ' +
				stringifyLargeInt(Outliner.elements.length)
		)
	}
}
const mode = new Mode(VARIANTS_MODE_ID, {
	condition: () => Format.id === format.id,
	name: tl('animatedJava.modes.variants.name'),
	hide_sidebars: false,
	onSelect() {
		Outliner.vue.$data.options.hidden_types.push('cube')
	},
	onDeselect() {
		Outliner.vue.$data.options.hidden_types.remove('cube')
		BarItems.cube_counter.onUpdate()
	},
	center_windows: ['preview', 'animated-java-variants-data-browser'],
})
const outliner = Interface.Panels.outliner
outliner.condition.modes.push(VARIANTS_MODE_ID)
bus.on(PLUGIN.UNLOAD, () => {
	mode.delete()
	BarItems.cube_counter.onUpdate = $originalBarUpdate
	outliner.condition.modes.splice(
		outliner.condition.modes.indexOf(VARIANTS_MODE_ID),
		1
	)
})
