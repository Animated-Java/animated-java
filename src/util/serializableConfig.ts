/**
 * Returns the "serialized" version of a class.
 *
 * Strips all properties with keys with values of type {@link Function} from {@link T}, and makes all properties optional.
 */
export type Serialized<T> = {
	[Key in keyof T as T[Key] extends Function ? never : Key]?: T[Key]
}

// interface Stupid extends SerializableConfig<SerializableConfig<Stupid>> {}

/**
 * A class that can be serialized to JSON.
 *
 * Any classes that inherit from this class require the {@link SerializableConfig.decorate} decorator to function properly!
 *
 * Any properties will be serialized to JSON. If a property is not intentionally set, it will be omitted from the JSON.
 *
 * @example
 * ```ts
 * // Ignore the ; in the next line, it's just to make the code block work
 * ;@SerializableConfig.decorate
 * class MyConfig extends SerializableConfig<MyConfig> {
 * 	foo? = 'string'
 * 	bar?: number
 * }
 *
 * const config = new MyConfig()
 * console.log(config.toJSON()) // {} - Default values are excluded from the JSON
 * console.log(config.foo) // 'string' - But they are still accessible when reading
 * console.log(config.get('foo', 'local')) // undefined - Unless you explicitly ask for the local value
 * // Only explicitly set values are included in the JSON
 * config.foo = 'baz'
 * console.log(config.toJSON()) // { foo: 'baz' }
 * config.foo = undefined
 * config.bar = 42
 * console.log(config.toJSON()) // { bar: 42 }
 * console.log(config.foo) // 'string'
 * ```
 */
export class SerializableConfig<
	const Config extends Record<string, any>,
	const Object extends Serialized<Config> = Serialized<Config>,
	const JsonObject extends Object & {
		__inheritedKeys__?: Array<string & keyof Object>
	} = Object & {
		__inheritedKeys__?: Array<string & keyof Object>
	},
> {
	private static __propertyDisplayConfigs__: Partial<Record<string, PropertyDisplayConfig>> = {}
	private __defaultValues__ = {} as Record<string, any>
	private __inheritedKeys__ = new Set<string & keyof Object>()
	private __getLocal__ = false
	/** The actual instance of {@link Config} (No proxies) */
	private __origin__: SerializableConfig<Config>
	private __parent__?: Config
	constructor() {
		// @ts-expect-error
		this.__origin__ = this
		const origin = this
		return new Proxy(this, {
			get(target, key: string & keyof Object) {
				// Return the value if it's set in this config
				// @ts-expect-error
				if (target[key] != undefined) {
					return target[key]
				}
				// Check inheritance / default value if we're not expecting a local value.
				if (!origin.__getLocal__) {
					// If the key is inherited, return the value from the parent if it's set there
					if (origin.__inheritedKeys__.has(key)) {
						const parentValue = target.__parent__?.[key]
						if (parentValue != undefined) {
							return parentValue
						}
					}
					// Default
					return origin.__defaultValues__[key]
				}
				// Return undefined if non of the above
				return undefined
			},
			set(target, key: string, newValue) {
				// @ts-expect-error
				target[key] = newValue
				return true
			},
		})
	}
	private __postInitialize() {
		for (const key of Object.getOwnPropertyNames(this) as Array<string & keyof Object>) {
			if (key.startsWith('_')) continue
			// @ts-expect-error
			this.__defaultValues__[key] = this[key]
			// @ts-expect-error
			this[key] = undefined
		}
	}
	/**
	 * Serialize the config to a JSON object.
	 * @param metaData If true, include metadata such as inherited keys.
	 */
	toJSON(metaData = true): JsonObject {
		const result = {} as JsonObject
		for (const key of Object.getOwnPropertyNames(this) as Array<string & keyof Object>) {
			if (key.startsWith('_')) continue
			const value = this.get(key, 'local-inherited')
			if (value != undefined) {
				result[key] = value
			}
		}
		if (metaData && this.__inheritedKeys__.size > 0) {
			result.__inheritedKeys__ = Array.from(this.__inheritedKeys__) as Array<
				string & keyof Object
			>
		}
		return JSON.parse(JSON.stringify(result))
	}
	/**
	 * Initialize the config from a JSON object.
	 * @param json The JSON object to initialize the config from.
	 * @param partial If true, only set the properties that are present in the JSON object. Otherwise, clear all properties that are not present in the JSON object.
	 */
	fromJSON(json: Partial<JsonObject>, partial = false): this {
		json = JSON.parse(JSON.stringify(json))
		if (json.__inheritedKeys__) {
			this.__inheritedKeys__ = new Set(json.__inheritedKeys__)
		} else if (!partial) {
			this.__inheritedKeys__ = new Set()
		}
		for (const key of Object.getOwnPropertyNames(this) as Array<string & keyof Object>) {
			if (key.startsWith('_')) continue
			// Explicitly check for nullish, and use undefined if the key is not present in the JSON.
			if (json[key] != undefined) {
				// @ts-expect-error
				this[key] = json[key]
			} else if (!partial) {
				// @ts-expect-error
				this[key] = undefined
			}
		}
		return this
	}
	isDefault(): boolean {
		return Object.getOwnPropertyNames(this).every(key => {
			if (key.startsWith('_')) return true
			// @ts-expect-error
			return this[key] == undefined
		})
	}
	/**
	 * Explicitly set the value of {@link key} to its default.
	 *
	 * Note that this is different from setting it to `undefined`.
	 */
	makeDefault(key: string & keyof Object): void {
		// @ts-expect-error
		this[key] = this.__defaultValues__[key]
	}
	/**
	 * Checks whether two configs are equal.
	 */
	equalTo(other: Config): boolean {
		for (const key of Object.getOwnPropertyNames(this)) {
			if (key.startsWith('_')) continue
			// @ts-expect-error
			if (this[key] !== other[key]) return false
		}
		return true
	}
	/**
	 * Set the value of {@link key} to be (or not to be) inherited from the parent if it's not set locally.
	 * @param key The key to set the inheritance of.
	 * @param inherit Whether or not to inherit the value from the parent.
	 */
	setKeyInheritance(key: string & keyof Object, inherit = true): this {
		if (inherit) {
			this.__inheritedKeys__.add(key)
		} else {
			this.__inheritedKeys__.delete(key)
		}
		return this
	}
	/**
	 * Get the inheritance status of {@link key}.
	 * @returns Whether or not the key is inherited from the parent.
	 */
	getKeyInheritance(key: string & keyof Object): boolean {
		return this.__inheritedKeys__.has(key)
	}
	/**
	 * Gets the value of {@link key} based on {@link getMode}
	 * @returns If {@link getMode} is `local`, returns the explicitly set value of property {@link key} on this instance. If {@link getMode} is `local-inherited`
	 * and the local value is `undefined`, it attempts to return the parent's explicitly set `local-inherited` value. If {@link getMode} is `default` it will return the `key`'s default value.
	 */
	get(
		key: string & keyof Object,
		getMode: 'local' | 'local-inherited'
	): Object[string & keyof Object] | undefined
	get(key: string & keyof Object, getMode: 'default'): Object[string & keyof Object]
	get(
		key: string & keyof Object,
		getMode: 'local' | 'local-inherited' | 'default'
	): Object[string & keyof Object] | undefined {
		if (getMode === 'default') {
			return this.__defaultValues__[key]
		}
		// @ts-expect-error
		const local = this.__origin__[key]
		if (local != undefined) {
			// Return the explicitly set local value
			return local
		}
		if (getMode === 'local') return undefined
		if (this.__inheritedKeys__.has(key) && this.__parent__) {
			// Return the inherited value if it's explicitly set.
			const inherited = this.__parent__.get(key)
			if (inherited != undefined) {
				return inherited
			}
		}
	}
	/**
	 * Set the value of {@link key} to {@link value}.
	 *
	 * Convenience method for `config[key] = value` typing issues.
	 */
	set(key: string & keyof Object, value: Object[string & keyof Object]): this {
		// @ts-expect-error
		this[key] = value
		return this
	}
	/**
	 * Set the parent of this config.
	 *
	 * Any properties that are not set in this config will be fetched from the parent.
	 */
	setParent(parent: Config | undefined): this {
		this.__parent__ = parent
		return this
	}
	/**
	 * @param sort If true, sort the keys alphabetically. If a function, sort the keys using the function. The sort function
	 * uses the same implementation as {@link Array.prototype.sort}.
	 */
	keys(sort?: boolean): Array<string & keyof Object>
	keys(sort?: (a: string, b: string) => number): Array<string & keyof Object>
	keys(sort?: boolean | ((a: string, b: string) => number)): Array<string & keyof Object> {
		const keys: Array<string & keyof Object> = []
		const names = Object.getOwnPropertyNames(this)
		if (sort === true) {
			names.sort()
		} else if (typeof sort === 'function') {
			names.sort(sort)
		}
		for (const key of names) {
			if (key.startsWith('_')) continue
			keys.push(key as string & keyof Object)
		}
		return keys
	}
	values(): Array<Object[string & keyof Object]> {
		const values: Array<Object[string & keyof Object]> = []
		for (const key of Object.getOwnPropertyNames(this)) {
			if (key.startsWith('_')) continue
			// @ts-expect-error
			values.push(this[key])
		}
		return values
	}
	/**
	 * Get the linked status of a key.
	 *
	 * Indicates if {@link key} can be inherited from the parent.
	 * Returns false if the key is explicitly set locally.
	 */
	getLinkedState(key: string & keyof Object): boolean {
		return this.get(key, 'local') == undefined
	}
	/**
	 * Get the linked status of all keys.
	 *
	 * A key's linked status Indicates if that key can be inherited from the parent.
	 * Returns false if the key is explicitly set locally.
	 */
	getAllLinkedStates(): Map<string & keyof Object, boolean> {
		const map = new Map<string & keyof Object, boolean>()
		for (const key of this.keys()) {
			map.set(key, this.get(key, 'local') == undefined)
		}
		return map
	}
	/**
	 * @param sort If true, sort the entries alphabetically. If a function, sort the entries using the function. The function
	 * uses the same implementation as {@link Array.prototype.sort}.
	 */
	entries(sort?: boolean): Array<[string & keyof Object, Object[string & keyof Object]]>
	entries(
		sort?: (a: string, b: string) => number
	): Array<[string & keyof Object, Object[string & keyof Object]]>
	entries(
		sort?: boolean | ((a: string, b: string) => number)
	): Array<[string & keyof Object, Object[string & keyof Object]]> {
		const entries: Array<[string & keyof Object, Object[string & keyof Object]]> = []
		const names = Object.getOwnPropertyNames(this)
		if (sort === true) {
			names.sort()
		} else if (typeof sort === 'function') {
			names.sort(sort)
		}
		for (const key of names) {
			if (key.startsWith('_')) continue
			// @ts-expect-error
			entries.push([key, this[key]])
		}
		return entries
	}
	getPropertyDescription(key: string & keyof Object): PropertyDisplayConfig | undefined {
		return this.constructor.prototype.__propertyDisplayConfigs__?.[key]
	}
	/**
	 * Decorator to make a class a serializable config.
	 */
	// FetchBot is the GOAT 🐐
	static decorate<Class extends new (...args: any[]) => SerializableConfig<Record<string, any>>>(
		settingClass: Class
	) {
		return new Proxy(settingClass, {
			construct(target, args) {
				const instance = new target(...(args as []))
				instance.__postInitialize()
				return instance
			},
		})
	}
	static configurePropertyDisplay(options: PropertyDisplayConfig) {
		return ((target, key) => {
			target.constructor.prototype.__propertyDisplayConfigs__ ??= {}
			target.constructor.prototype.__propertyDisplayConfigs__[key] = options
		}) satisfies PropertyDecorator
	}
}

interface IPropertyDisplayConfig {
	displayName: string
}

interface IPropertyDisplayConfigs {
	select: IPropertyDisplayConfig & {
		displayMode: 'select'
		options: string[]
	}
	color: IPropertyDisplayConfig & {
		displayMode: 'color'
	}
	checkbox: IPropertyDisplayConfig & {
		displayMode: 'checkbox'
	}
	code_editor: IPropertyDisplayConfig & {
		displayMode: 'code_editor'
		syntax: string
	}
	slider: IPropertyDisplayConfig & {
		displayMode: 'slider'
		min?: number
		max?: number
		step: number
	}
	number: IPropertyDisplayConfig & {
		displayMode: 'number'
		min?: number
		max?: number
		step: number
	}
}

export type PropertyDisplayConfig = IPropertyDisplayConfigs[keyof IPropertyDisplayConfigs]
