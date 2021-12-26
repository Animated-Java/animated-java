import { command } from './types'

export class MCFunction {
	public commands: command[]

	constructor(commands?: command[]) {
		this.commands = commands
	}

	addCommand(command: command) {
		this.commands.push(command)
	}

	toString() {
		return ['#Generated using Animated Java', ...this.commands].join('\n')
	}
}
