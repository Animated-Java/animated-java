const EventSystem_Handlers = Symbol.for('EventSystem.Handlers')
let idBase = 0
class EventSystem {
	id: string | number
	static stack = []
	constructor(name?: string) {
		this[EventSystem_Handlers] = new Map()
		this.id = name || idBase++
	}
	createNewEventFrame() {
		const set = new Set()
		const top =
			EventSystem.stack.length > 0
				? EventSystem.stack[EventSystem.stack.length - 1]
				: new Set()
		top.forEach((item: any) => set.add(item))
		EventSystem.stack.push(set)
		return set
	}
	mergeEventFrame() {
		const top = EventSystem.stack.pop()
		if (EventSystem.stack.length > 0) {
			const last = EventSystem.stack[EventSystem.stack.length - 1]
			top.forEach((item: any) => last.add(item))
		}
	}

	_getEventListForType(type: string) {
		const handlers = this[EventSystem_Handlers]
		if (handlers.has(type)) {
			return handlers.get(type)
		} else {
			handlers.set(type, [])
			return handlers.get(type)
		}
	}
	_unregisterEventHandler(type: string, handler: (event: any) => void) {
		const handlers = this[EventSystem_Handlers]
		const list = this._getEventListForType(type)
		handlers.set(
			type,
			list.filter((reciever: any) => reciever.handler != handler)
		)
	}
	on(name: string, handler: (event: any) => void): () => void {
		const list = this._getEventListForType(name)
		list.push({
			handler,
			type: 'on',
		})
		return this._unregisterEventHandler.bind(this, name, handler)
	}
	once(name: string, handler: (event: any) => void): () => void {
		const list = this._getEventListForType(name)
		list.push({
			handler,
			type: 'once',
		})
		return this._unregisterEventHandler.bind(this, name, handler)
	}
	dispatch(type: string, payload: any) {
		const eventFrame = this.createNewEventFrame()
		// console.log(`[event (${this.id}): dispatch] `, type)
		Object.freeze(payload)
		const recipients = this._getEventListForType(type)
		const errors = []
		for (let recipient of recipients) {
			try {
				if (!eventFrame.has(recipient.handler)) {
					eventFrame.add(recipient.handler)
					recipient.handler(payload)
				} else {
					console.log(
						'[event (${this.id}): dispatch] not running handler as its already been run during this dispatch cycle'
					)
				}
			} catch (e) {
				console.error(e)
				errors.push(e)
			}
		}
		if (errors.length) {
			console.warn(
				`[event (${this.id}): dispatch] got ${errors.length} errors while dispatching event '${type}' with payload`,
				payload
			)
		}
		recipients.splice(
			0,
			Infinity,
			...recipients.filter((recipient: any) => recipient.type != 'once')
		)
		this.mergeEventFrame()
	}
}

export { EventSystem }
