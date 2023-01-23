import { AJDialog } from './ajDialog'
import Settings from './settings.svelte'

export function openAjSettingsDialog() {
	const dialog = new AJDialog({
		// @ts-ignore
		svelteComponent: Settings,
		title: 'Animated Java Settings',
		id: 'animatedJava.settings',
	}).show()
}
