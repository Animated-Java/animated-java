import EVENTS from './constants/events'
import { format } from './modelFormat'
import { bus } from './util/bus'

import { settings } from './settings'
function createBox() {
	const a = new THREE.BoxBufferGeometry(16 * 7, 16 * 7, 16 * 7)
	const b = new THREE.EdgesGeometry(a)
	const c = new THREE.LineSegments(
		b,
		new THREE.LineBasicMaterial({ color: 0xff0000 })
	)
	c.position.y = 8
	return c
}

let visboxs = []
let last = null
let last_mult = null
let Selected = null
let mode
Blockbench.on('update_selection', () => {
	if (format.id === Format.id) {
		if (Group.selected || Mode.selected.name === 'Animate') {
			Format.rotation_limit = false
		} else {
			Format.rotation_limit = true
		}
	}
})
const _condition = BarItems.rescale_toggle.condition
BarItems.rescale_toggle.condition = function () {
	if (Format.id === format.id) {
		return true
	} else {
		return _condition.apply(this)
	}
}

bus.on(EVENTS.LIFECYCLE.LOAD, () => {
	const frame = () => {
		if (format.id === Format.id) {
			const viewmode = settings.animatedJava.boundingBoxRenderMode
			if (viewmode !== mode) {
				mode = viewmode
				visboxs.forEach((v) => v.parent.remove(v))
				Array.from(last_mult || []).forEach((item) => {
					if (item.visbox) {
						item.mesh.remove(item.visbox)
						console.log(`remove ${item.name}`)
						delete item.visbox
					}
				})
				visboxs = []
				last = null
				last_mult = null
				Selected = null
			}
			if (Mode.selected.id === 'edit' && viewmode !== 'none') {
				if (viewmode === 'single') {
					let parent = null
					if (Group.selected && Group.selected.name !== 'SCENE') {
						parent = Group.selected
					} else if (Cube.selected.length) {
						if (Cube.selected[0].parent !== 'root')
							parent = Cube.selected[0].parent
					}
					if (parent !== last) {
						if (visboxs.length) {
							visboxs.forEach((v) => v.parent.remove(v))
							visboxs = []
						}
						if (parent && parent.name !== 'SCENE') {
							const b = createBox()
							parent.mesh.add(b)
							visboxs.push(b)
						}
						last = parent
					}
				} else {
					// view many
					last_mult = Selected
					Selected = new Set()
					if (Group.selected) Selected.add(Group.selected)
					if (Cube.selected.length) {
						Cube.selected.forEach((cube) => {
							Selected.add(cube.parent)
						})
					}
					const items = Array.from(Selected)
					const old = Array.from(last_mult || [])
					items.forEach((item) => {
						if (!last_mult || !last_mult.has(item)) {
							item.visbox = createBox()
							visboxs.push(item.visbox)
							item.mesh.add(item.visbox)
							console.log(`add ${item.name}`)
						}
					})
					old.forEach((item) => {
						if (!Selected.has(item)) {
							if (item.visbox) {
								item.mesh.remove(item.visbox)
								console.log(`remove ${item.name}`)
								visboxs.splice(visboxs.indexOf(item.visbox), 1)
								delete item.visbox
							}
						}
					})
				}
			} else if (last || last_mult) {
				visboxs.forEach((v) => v.parent.remove(v))
				Array.from(last_mult || []).forEach((item) => {
					if (item.visbox) {
						item.mesh.remove(item.visbox)
						console.log(`remove ${item.name}`)
						delete item.visbox
					}
				})
				visboxs = []
				last = null
				last_mult = null
				Selected = null
			}
		}
		requestAnimationFrame(frame)
	}
	requestAnimationFrame(frame)
	bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
		cancelAnimationFrame(frame)
		BarItems.rescale_toggle.condition = _condition
	})
})
