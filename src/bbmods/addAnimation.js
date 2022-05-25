import { format } from 'path'
import { bus } from '../util/bus'
import * as EVENTS from '../constants/events'

const oldMethod = Interface.Panels.animations.vue.addAnimation

function newMethod(path) {
	let other_animation = Animation.all.find(a => a.path == path)
	new Animation({
		name: other_animation && other_animation.name.replace(/\w+$/, 'new'),
		snapping: Format.id === format.id ? 20 : undefined,
		path,
	})
		.add(true)
		.propertiesDialog()
}

bus.on(EVENTS.LIFECYCLE.LOAD, () => {
	Interface.Panels.animations.vue.addAnimation = newMethod
})

bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
	Interface.Panels.animations.vue.addAnimation = oldMethod
})
