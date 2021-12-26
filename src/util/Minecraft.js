import nbtlint from '../dependencies/nbtlint/docs/nbt-lint'
import { CustomError } from './CustomError'

export class EntityPos {
	constructor(obj) {
		this.x = obj?.x || '~'
		this.y = obj?.y || '~'
		this.z = obj?.z || '~'
	}
	toStr() {
		return `${this.x} ${this.y} ${this.z}`
	}
}

export class Entity {
	constructor(obj) {
		this.entity_type = obj.entity_type || 'minecraft:armor_stand'
		this.pos = new EntityPos(obj.pos)
		this.nbt = obj.nbt || new nbtlint.TagCompound({})
	}
	toSummonCommand() {
		return `summon ${
			this.entity_type
		} ${this.pos.toStr()} ${nbtlint.stringify(this.nbt)}`
	}
}

export class JsonText {
	constructor(_json) {
		this._json = _json
	}
	toString() {
		return JSON.stringify(this._json)
	}
}
