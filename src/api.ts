import { PACKAGE } from './constants'
import { createBlockbenchMod } from './util/moddingTools'

import { mount } from 'svelte'
import Test from './svelte-components/test.svelte'

console.log(Test)

const PLUGIN_API = {
	API: {
		test() {
			mount(Test, { target: document.querySelector('div.button_bar')! })
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
