/**
 * Returns the "serialized" version of a class.
 *
 * Simply strips all functions from the class type, and makes all properties optional.
 */
export type Serialized<T> = {
	[Key in keyof T as T[Key] extends Function ? never : Key]?: T[Key]
}
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
 * console.log(config.getLocalValue('foo')) // undefined - Unless you explicitly ask for the local value
 * // Only explicitly set values are included in the JSON
 * config.foo = 'baz'
 * console.log(config.toJSON()) // { foo: 'baz' }
 * config.foo = undefined
 * config.bar = 42
 * console.log(config.toJSON()) // { bar: 42 }
 * console.log(config.foo) // 'string'
 * ```
 */
export class SerializableConfig<Config, T extends Record<string, any> = Serialized<Config>> {
	private __defaultValues__ = {} as Record<string, any>
	private __returnDefaults__ = true
	private __parent__?: Config

	constructor() {
		const scope = this
		return new Proxy(this, {
			get(target, key: string) {
				if (key === '$local') return

				// @ts-expect-error
				if (!scope.__returnDefaults__) return target[key] ?? scope.__parent__?.[key]
				// @ts-expect-error
				return target[key] ?? scope.__parent__?.[key] ?? scope.__defaultValues__[key]
			},
			set(target, key: string, newValue) {
				// @ts-expect-error
				target[key] = newValue
				return true
			},
		})
	}

	private postInitialize() {
		for (const key of Object.getOwnPropertyNames(this)) {
			if (key.startsWith('_')) continue
			// @ts-expect-error
			this.__defaultValues__[key] = this[key]
			// @ts-expect-error
			this[key] = undefined
		}
	}

	toJSON(): T {
		this.__returnDefaults__ = false
		const result = {} as Record<string, any>
		for (const key of Object.getOwnPropertyNames(this)) {
			if (key.startsWith('_')) continue
			// @ts-expect-error
			if (this[key] != undefined) {
				// @ts-expect-error
				result[key] = this[key]
			}
		}
		this.__returnDefaults__ = true
		return result as T
	}

	fromJSON(json: Partial<T>) {
		for (const key of Object.getOwnPropertyNames(this)) {
			if (key.startsWith('_')) continue
			// Explicitly check for nullish, and use undefined if the key is not present in the JSON.
			if (json[key] != undefined) {
				// @ts-expect-error
				this[key] = json[key]
			} else {
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
	 * Set the parent of this config.
	 */
	getDefaultValue<Key extends keyof T>(key: Key): NonNullable<T[Key]> {
		// @ts-expect-error
		return this.__defaultValues__[key]
	}

	/**
	 * Set the value of {@link key} to its default value.
	 *
	 * Note that this is different from setting it to undefined.
	 */
	makeDefaultValue<Key extends keyof T>(key: Key): void {
		// @ts-expect-error
		this[key] = this.__defaultValues__[key]
	}

	equalTo(other: Config): boolean {
		for (const key of Object.getOwnPropertyNames(this)) {
			if (key.startsWith('_')) continue
			// @ts-expect-error
			if (this[key] !== other[key]) return false
		}
		return true
	}

	/**
	 * Get the local value of {@link key}, ignoring the default and parent values.
	 */
	getLocalValue<Key extends keyof T>(key: Key): T[Key] | undefined {
		this.__returnDefaults__ = false
		// @ts-expect-error
		const result = this[key]
		this.__returnDefaults__ = true
		return result
	}

	/**
	 * Set the parent of this config.
	 *
	 * Any properties that are not set in this config will be fetched from the parent.
	 */
	setParent(parent: Config) {
		this.__parent__ = parent
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
				instance.postInitialize()
				return instance
			},
		})
	}
}
