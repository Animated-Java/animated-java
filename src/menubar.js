import { bus, tl } from './util'
import EVENTS from './constants/events'

bus.on(EVENTS.LIFECYCLE.LOAD, () => {
	const menu = new BarMenu('JavaAnimation', [], () => Format.id === format.id)
	document.querySelector('#menu_bar').appendChild(menu.label)
	menu.label.innerHTML = tl('menubar.dropdown.lable')
	MenuBar.addAction(build_model, 'JavaAnimation')
	MenuBar.addAction(
		CustomAction({
			icon: 'info',
			category: 'AnimatedJava',
			name: tl('menubar.dropdown.name'),
			id: 'java_plugin_about',
			condition: () => format.id === Format.id,
			click: function () {
				About()
			},
		}),
		'JavaAnimation'
	)
	MenuBar.update()
	Blockbench.on('new_project', () => {
		store.set('states', { default: {} })
		settings.update(DefaultSettings)
		bus.dispatch(EVENTS.LIFECYCLE.LOAD_MODEL, {})
	})
	bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
		menu.label.remove()
	})
})
