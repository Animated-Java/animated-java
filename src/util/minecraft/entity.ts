import { JsonText, NBT, NBTType } from '.'
import { namespacedID, position } from './types'

export class Entity {
	public type: namespacedID
	public pos: position
	public nbt?: NBT<NBTType.COMPOUND>

	constructor(_type: namespacedID, pos: position, nbt?: NBT<NBTType.COMPOUND>) {
		this.type = _type
		this.pos = pos
		this.nbt = nbt
	}

	toString() {
		const nbt = this.nbt ? ` ${this.nbt}` : ''
		return `summon ${this.type} ${this.pos.x} ${this.pos.y} ${this.pos.z}` + nbt
	}
}
