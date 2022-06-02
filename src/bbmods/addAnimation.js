import { format } from 'path'
import { bus } from '../util/bus'
import * as EVENTS from '../constants/events'

const oldMethod = Interface.Panels.animations.vue.addAnimation

function newMethod(path) {
	console.log('Animation path:', path)
	const anim = new Animation({
		name: 'new_animation',
		snapping: Format.id === format.id ? 20 : undefined,
		path,
	}).add(true)
	// anim.propertiesDialog()
}
// FIXME This WORKS but it's waiting for blockbench to be updated to fix it.
Interface.Panels.animations.vue.addAnimation = newMethod

bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
	Interface.Panels.animations.vue.addAnimation = oldMethod
})
