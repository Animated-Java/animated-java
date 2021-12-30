import { bus } from './bus'
import { EventSystem } from './eventSystem'

const StoreRef_UpdateReceiver = Symbol.for('StoreRef.UpdateReceiver')
const StoreRef_Target = Symbol.for('StoreRef.Target')
const StoreRef_Parent = Symbol.for('StoreRef.Parent')
const StoreRef_Current = Symbol.for('StoreRef.Current')
const StoreRef_Name = Symbol.for('StoreRef.Name')
const StoreRef_Watchers = Symbol.for('StoreRef.Watchers')
const Store_IO = Symbol.for('Store.IO')

class StoreRef {
	unreference: () => void;
	[StoreRef_Watchers] = [];
	[StoreRef_UpdateReceiver] = (event) => {
		this[StoreRef_Current] = event.value
		this[StoreRef_Watchers].forEach((cb) => cb())
	}
	constructor({ parent, target, value, name }) {
		this[StoreRef_Parent] = parent
		this[StoreRef_Target] = target
		this[StoreRef_Current] = value
		this[StoreRef_Name] = name
		this.unreference = this[StoreRef_Parent][Store_IO].on(
			`update:ref:${this[StoreRef_Target]}`,
			this[StoreRef_UpdateReceiver]
		)
		bus.on('unload', () => this.delete())
	}
	get current() {
		return this[StoreRef_Current]
	}
	set current(value) {
		this[StoreRef_Parent].set(this[StoreRef_Name], value)
	}
	delete() {
		this[StoreRef_Current] = null
		this.unreference()
	}
	watch(cb: (value: any) => void) {
		this[StoreRef_Watchers].push(cb)
		return () =>
			this[StoreRef_Watchers].slice(
				this[StoreRef_Watchers].indexOf(cb),
				1
			)
	}
}

export class Store extends Map {
	constructor(values: any, name: string) {
		// @ts-ignore
		super(values)
		this[Store_IO] = new EventSystem(name)
	}
	getRefName(id: string) {
		return `ref:${id.toString()}`
	}
	updateRefsFor(id: string) {
		this[Store_IO].dispatch('update:' + this.getRefName(id), {
			value: super.get(id),
		})
		this[Store_IO].dispatch('update', {
			value: super.get(id),
		})
	}
	has(name: string) {
		const hash = this.hash(name)
		return super.has(hash)
	}
	get(name: string) {
		const hash = this.hash(name)
		return super.get(hash)
	}
	set(name: string, value: any) {
		const hash = this.hash(name)
		let result = super.set(hash, value)
		this.updateRefsFor(hash)
		return result
	}
	delete(name: string) {
		const hash = this.hash(name)
		return super.delete(hash)
	}
	hash(str: string) {
		return str
		// return str + "@" + hashstr(str);
	}
	ref(target: string) {
		return new StoreRef({
			parent: this,
			target: this.hash(target),
			value: this.get(target),
			name: undefined,
		})
	}
	getStore(name: string) {
		if (this.has(name)) {
			return this.get(name)
		} else {
			const storage = new Store([], name)
			this.set(name, storage)
			return storage
		}
	}
	// load(obj: string | {value: [string, any][]}) {
	// 	if (typeof obj === 'string') {
	// 		return this.load(JSON.parse(obj))
	// 	}
	// 	const values = obj.value
	// 	for (const [key, value] in values) {
	// 		if (typeof value === 'string' && value.type === 'Store') {
	// 			const store = new Store([], 'main_store')
	// 			store.load(value)
	// 			super.set(key, store)
	// 		} else {
	// 			super.set(key, value)
	// 		}
	// 	}
	// }
	serialize() {
		return this.toJSON()
	}
	toJSON() {
		return JSON.stringify({
			value: Array.from(this.entries()),
			type: 'Store',
		})
	}
	watch(cb: (value: any) => void) {
		return this[Store_IO].on('update', cb)
	}
}
// @ts-ignore
export const store = new Store([], 'DATA_STORE')
