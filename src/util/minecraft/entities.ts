import { registry } from './registryLoader'

export class Entities {
	static list = []

	static isEntity(name: string) {
		return Entities.list.includes(name)
	}
}

registry.then(v => {
	Entities.list = v.entity_type.map(v => `minecraft:${v}`)
})
