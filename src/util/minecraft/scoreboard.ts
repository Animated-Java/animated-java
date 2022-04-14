import { format, FormatObject } from '../replace'
import { JsonText } from './jsonText'

export class ScoreboardObjective {
	name: string
	type: string
	displayName?: JsonText
	constructor(name: string, type: string, displayName?: JsonText) {
		this.name = name
		this.type = type
		this.displayName = new JsonText(JSON.parse(format(displayName.toString(), { name })))
	}
	toString() {
		return this.name
	}
	createString() {
		return `scoreboard objectives add ${this.name} ${this.type}${
			this.displayName ? ' ' + this.displayName.toString() : ''
		}`
	}
	removeString() {
		return `scoreboard objectives remove ${this.name}`
	}
}

type ScoreboardObjectivesObject = { [key: string]: ScoreboardObjective }
type ScoreboardTagsObject = { [key: string]: string }

export class Scoreboard {
	objectives: ScoreboardObjectivesObject
	tags: ScoreboardTagsObject
	constructor(objectives: ScoreboardObjectivesObject, tags: ScoreboardTagsObject) {
		this.objectives = objectives
		this.tags = tags
	}
	addObj(key: string, obj: ScoreboardObjective) {
		this.objectives[key] = obj
		return this
	}
	addTag(key: string, tag: string) {
		this.tags[key] = tag
		return this
	}
	get obj() {
		return this.objectives
	}
}
