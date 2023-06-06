import { consoleGroup } from './console'
import * as events from '../events'
import { Subscribable } from './subscribable'

export type NamespacedString = `${string}${string}:${string}${string}`

class BlockbenchModInstallError extends Error {
	constructor(id: string, err: Error) {
		super(`Mod '${id}' failed to install: ${err.message}` + (err.stack ? '\n' + err.stack : ''))
	}
}

class BlockbenchModUninstallError extends Error {
	constructor(id: string, err: Error) {
		super(
			`Mod '${id}' failed to uninstall: ${err.message}` + (err.stack ? '\n' + err.stack : '')
		)
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
	id: NamespacedString,
	context: InjectContext,
	inject: (context: InjectContext) => ExtractContext,
	extract: (context: ExtractContext) => void
) {
	let installed = false
	let extractContext: ExtractContext

	events.INJECT_MODS.subscribe(
		consoleGroup(`Injecting BBMod '${id}'`, () => {
			try {
				if (installed) new Error('Mod is already installed!')
				extractContext = inject(context)
				installed = true
			} catch (err) {
				throw new BlockbenchModInstallError(id, err as Error)
			}
			console.log('Sucess!')
		}),
		true
	)

	events.EXTRACT_MODS.subscribe(
		consoleGroup(`Extracting BBMod '${id}'`, () => {
			try {
				if (!installed) new Error('Mod is not installed!')
				extract(extractContext)
				installed = false
			} catch (err) {
				throw new BlockbenchModUninstallError(id, err as Error)
			}
			console.log('Sucess!')
		}),
		true
	)
}

/** Creates a new Blockbench.Action and automatically handles it's deletion on the plugin unload and uninstall events.
 * See https://www.blockbench.net/wiki/api/action for more information on the Blockbench.Action class.
 * @param id A namespaced ID ('my-plugin-id:my-action')
 * @param options The options for the action.
 * @returns The created action.
 */
export function createAction(id: NamespacedString, options: ActionOptions) {
	const action = new Action(id, options)

	events.EXTRACT_MODS.subscribe(() => {
		action.delete()
	}, true)

	return action
}

/**
 * Creates a new Blockbench.Menu and automatically handles it's deletion on the plugin unload and uninstall events.
 * See https://www.blockbench.net/wiki/api/menu for more information on the Blockbench.Menu class.
 * @param template The menu template.
 * @param options The options for the menu.
 * @returns The created menu.
 */
export function createMenu(template: MenuItem[], options?: MenuOptions) {
	const menu = new Menu(template, options)

	// events.EXTRACT_MODS.subscribe(() => {
	// 	menu.delete()
	// }, true)

	return menu
}

/**
 * Creates a new Blockbench.BarMenu and automatically handles it's deletion on the plugin unload and uninstall events.
 * @param id A namespaced ID ('my-plugin-id:my-menu')
 * @param structure The menu structure.
 * @param condition The condition for the menu to be visible.
 * @returns The created menu.
 */
export function createBarMenu(
	id: NamespacedString,
	structure: MenuItem[],
	condition: ConditionResolvable
) {
	const menu = new BarMenu(id, structure, condition)

	// events.EXTRACT_MODS.subscribe(() => {
	// 	menu.delete()
	// }, true)

	return menu
}

interface Storage<Value = any> {
	value: Value
}
const SUBSCRIBABLES = new Map<
	any,
	[
		Subscribable<{ storage: Storage<any>; value: any }>,
		Subscribable<{ storage: Storage<any>; newValue: any }>
	]
>()

/**
 * Creates a subscribable for a property on an object.
 * @param object The object to create the subscribable for.
 * @param key The key of the property on the object.
 * @returns A tuple of {@link Subscribable | Subscribables} [onGet, onSet]
 * @example
 * Using the subscribables as simple events.
 * ```ts
 * const [onGet, onSet] = createPropertySubscribable(Blockbench, 'version')
 * onGet.subscribe(({ value }) => console.log('Blockbench version:', value))
 * onSet.subscribe(({ newValue }) => console.log('Blockbench version changed to:', newValue))
 * ```
 * @example
 * Using the subscribables to change the value of a Property.
 * ```ts
 * const [, onSet] = createPropertySubscribable(Blockbench, 'version')
 * onSet.subscribe(({ storage, newValue }) => {
 * 	if (newValue === '1.0.0') storage.value = '1.0.1'
 * })
 * ```
 * Note that `storage.value` can be modified by other subscribers, but `newValue` is the value that was set.
 * You decide if you want to operate on `newValue` or the possibly modified `storage.value`.

 * The Getter can also modify `storage.value`, but this is not recommended.
 */
export function createPropertySubscribable<Value = any>(object: any, key: string) {
	let subscribables = SUBSCRIBABLES.get(object)
	const storage: Storage<Value> = { value: object[key] }

	if (subscribables === undefined) {
		const onGet = new Subscribable<{
			storage: Storage<Value>
			value: Value
		}>()
		const onSet = new Subscribable<{ storage: Storage<Value>; newValue: Value }>()
		subscribables = [onGet, onSet]
		SUBSCRIBABLES.set(object, subscribables)

		Object.defineProperty(object, key, {
			get() {
				onGet.dispatch({ storage, value: storage.value })
				return storage.value
			},
			set(newValue: Value) {
				storage.value = newValue
				onSet.dispatch({ storage, newValue })
			},
		})

		events.EXTRACT_MODS.subscribe(() => {
			Object.defineProperty(object, key, {})
		}, true)
	}

	return subscribables
}
