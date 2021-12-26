import { bus } from './bus'
import events from '../constants/events'

export const action = (...args) => {
	const action = new Action(...args)
	bus.on(events.LIFECYCLE.CLEANUP, action.delete.bind(action))
	return action
}
