import { PACKAGE } from './constants'
import { createBlockbenchMod } from './util/moddingTools'

import Test from '@components/test.svelte'
import { mount, unmount } from 'svelte'
import { openBlueprintSettings } from './dialogs/blueprint-settings'
import { SvelteDialog } from './svelte/dialog'

const PLUGIN_API = {
	API: {
		svelte: {
			mount,
			unmount,
		},
		openBlueprintSettings,
		openTestDialog: () => {
			new SvelteDialog({
				id: 'animated-java:test-dialog',
				title: 'Test Dialog',
				component: Test,
				props: {},
				stackable: false,
				onOpen: () => console.log('Dialog opened'),
				onButton: index => console.log('Button clicked', index),
				onFormChange: data => console.log('Form changed', data),
				onConfirm: () => console.log('Dialog confirmed'),
				onCancel: () => console.log('Dialog canceled'),
				onClose: () => console.log('Dialog closed'),
			}).show()
		},
	},
}

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	var AnimatedJava: typeof PLUGIN_API
}

window.AnimatedJava = PLUGIN_API

createBlockbenchMod(
	`${PACKAGE.name}:inject/global-api`,
	undefined,
	() => {
		// @ts-expect-error
		globalThis[PACKAGE.name] = PLUGIN_API
	},
	() => {
		// @ts-expect-error: AnimatedJava type is not optional, but we want to delete it when uninstalling
		delete globalThis[PACKAGE.name]
	}
)
