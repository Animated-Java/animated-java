import { registry } from './registryLoader'

export class Items {
	static list: string[] = []

	static isItem(name: string) {
		return Items.list.includes(name)
	}
}

registry
	.then(v => {
		Items.list = v.item.map(v => `minecraft:${v}`)
	})
	.catch(e => {
		console.error(e)
	})
