import {
	hideLoadingPopup,
	showLoadingPopup,
	showOfflineError,
} from '../../ui/popups/animated-java-loading'
import EVENTS from '../../util/events'

EVENTS.LOAD.subscribe(() => {
	// Show loading popup
	void showLoadingPopup().then(async () => {
		if (!window.navigator.onLine) {
			showOfflineError()
			// return
		}
		EVENTS.NETWORK_CONNECTED.dispatch()

		await Promise.all([
			new Promise<void>(resolve => EVENTS.MINECRAFT_ASSETS_LOADED.subscribe(() => resolve())),
			new Promise<void>(resolve =>
				EVENTS.MINECRAFT_REGISTRY_LOADED.subscribe(() => resolve())
			),
			new Promise<void>(resolve => EVENTS.MINECRAFT_FONTS_LOADED.subscribe(() => resolve())),
			new Promise<void>(resolve =>
				EVENTS.BLOCKSTATE_REGISTRY_LOADED.subscribe(() => resolve())
			),
		])
			.then(() => {
				hideLoadingPopup()
			})
			.catch(error => {
				console.error(error)
				Blockbench.showToastNotification({
					text: 'Animated Java failed to load! Please restart Blockbench',
					color: 'var(--color-error)',
				})
			})
	})
})
