import { consoleGroup } from './console'
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
 * @param context The context of the mod. This is passed to the inject function.
 * @param inject The function that is called to install the mod.
 * @param extract The function that is called to uninstall the mod.
 * @template InjectContext The type of the context passed to the inject function.
 * @template ExtractContext The type of the context returned from the inject function and passed to the extract function.
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
 * 		return context
 * 	})
 * 	context => {
 * 		// Extract code here
 * 		Blockbench.Animation.prototype.select = context.original
 * 	})
 * ```
 */
export function createBlockbenchMod<InjectContext = any, ExtractContext = any>(
	id: `${string}${string}:${string}${string}`,
	context: InjectContext,
	inject: (context: InjectContext) => ExtractContext,
	extract: (context: ExtractContext) => void
) {
	let installed = false
	let extractContext: ExtractContext

	events.injectMods.subscribe(
		consoleGroup(`Injecting BlockbenchMod '${id}'`, () => {
			try {
				if (installed) new Error('Mod is already installed!')
				extractContext = inject(context)
				installed = true
			} catch (err: any) {
				throw new BlockbenchModInstallError(id, err)
			}
			console.log('Sucess!')
		}),
		true
	)

	events.extractMods.subscribe(
		consoleGroup(`Extracting BlockbenchMod '${id}'`, () => {
			try {
				if (!installed) new Error('Mod is not installed!')
				extract(extractContext)
				installed = false
			} catch (err: any) {
				throw new BlockbenchModUninstallError(id, err)
			}
			console.log('Sucess!')
		}),
		true
	)
}
