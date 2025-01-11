import { PACKAGE } from '../constants'
import {
	hideLoadingPopup,
	showLoadingPopup,
	showOfflineError,
} from '../interface/popup/animatedJavaLoading'
import { events } from '../util/events'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:assetLoading`,
	undefined,
	() => {
		// Show loading popup
		void showLoadingPopup().then(async () => {
			if (!window.navigator.onLine) {
				showOfflineError()
				// return
			}
			events.NETWORK_CONNECTED.dispatch()

			await Promise.all([
				new Promise<void>(resolve =>
					events.MINECRAFT_ASSETS_LOADED.subscribe(() => resolve())
				),
				new Promise<void>(resolve =>
					events.MINECRAFT_REGISTRY_LOADED.subscribe(() => resolve())
				),
				new Promise<void>(resolve =>
					events.MINECRAFT_FONTS_LOADED.subscribe(() => resolve())
				),
				new Promise<void>(resolve =>
					events.BLOCKSTATE_REGISTRY_LOADED.subscribe(() => resolve())
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
	},
	() => {
		//
	}
)
