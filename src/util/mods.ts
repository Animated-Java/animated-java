import * as events from './events'

class BlockbenchModInstallError extends Error {
	constructor(id: string, err: any) {
		super(`Mod '${id}' failed to install: ${err.message}\n${err.stack}}`)
	}
}

class BlockbenchModUninstallError extends Error {
	constructor(id: string, err: any) {
		super(`Mod '${id}' failed to uninstall: ${err.message}\n${err.stack}}`)
	}
}

/**
 * A simple helper function to make modifing Blockbench easier.
 * @param id A namespaced ID ('my-plugin-id:my-mod')
 * @param context The context of the mod. This is passed to the inject and extract functions.
 * @param inject The function that is called to install the mod.
 * @param extract The function that is called to uninstall the mod.
 * @example
 * ```ts
 * createBlockbenchMod(
 * 	'my-plugin-id:my-mod',
 * 	{
 * 		original: Blockbench.Animation.prototype.select
 * 	},
 * 	context => {
 * 		// Inject code here
 * 		Blockbench.Animation.prototype.select = function(this: _Animation) {
 * 			if (Format.id === myFormat.id) {
 * 				// Do something here
 * 			}
 * 			return context.original.call(this)
 * 		}
 * 	})
 * 	context => {
 * 		// Extract code here
 * 		Blockbench.Animation.prototype.select = context.original
 * 	})
 * ```
 */
export function createBlockbenchMod<C = any>(
	id: `${string}${string}:${string}${string}`,
	context: C,
	inject: (context: C) => void,
	extract: (context: C) => void
) {
	let installed = false

	events.loadMods.subscribe(() => {
		try {
			if (installed) new Error('Mod is already installed!')
			inject(context)
			installed = true
		} catch (err: any) {
			throw new BlockbenchModInstallError(id, err)
		}
	}, true)

	events.unloadMods.subscribe(() => {
		try {
			if (!installed) new Error('Mod is not installed!')
			extract(context)
			installed = false
		} catch (err: any) {
			throw new BlockbenchModUninstallError(id, err)
		}
	}, true)
}
