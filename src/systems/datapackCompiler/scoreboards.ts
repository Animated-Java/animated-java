import { JsonText } from '../../util/jsonText'

export class Scoreboard {
	public static all: Scoreboard[] = []
	constructor(public name: string, public displayName?: JsonText, public type = 'dummy') {}

	public toString() {
		return this.name
	}

	public toInitializer() {
		return `scoreboard objectives add ${this.name} ${this.type}${
			this.displayName ? ' ' + this.displayName.toString() : ''
		}`
	}

	public static get(name: string) {
		return Scoreboard.all.find(scoreboard => scoreboard.name === name)
	}
}

export function generateScoreboard() {
	new Scoreboard('aj.i')
	new Scoreboard('aj.id')
	new Scoreboard('aj.frame')
	new Scoreboard('aj.rig_is_loaded')
}
