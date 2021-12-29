import { bus } from './bus'
import events from '../constants/events'

export const CustomAction = (id: string, options: ActionOptions) => {
	const action = new Action(id, options)
	bus.on(events.LIFECYCLE.CLEANUP, action.delete.bind(action))
	return action
}
