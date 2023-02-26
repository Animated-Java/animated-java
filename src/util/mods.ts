import { events } from './events'

interface BlockbenchModOptions {
	id: string
	inject: () => void
	extract: () => void
}

const all: BlockbenchMod[] = []

export class BlockbenchMod {
	name: string
	inject: BlockbenchModOptions['inject']
	extract: BlockbenchModOptions['extract']

	constructor(options: BlockbenchModOptions) {
		this.name = options.id
		this.inject = options.inject
		this.extract = options.extract
		all.push(this)
	}
}

events.loadMods.subscribe(() =>
	all.forEach(mod => {
		try {
			mod.inject()
		} catch (err) {
			console.log(`Unexpected Error while attempting to inject mod '${mod.name}'!`)
			console.error(err)
			debugger
		}
	})
)
events.unloadMods.subscribe(() =>
	all.forEach(mod => {
		try {
			mod.extract()
		} catch (err) {
			console.log(`Unexpected Error while attempting to extract mod '${mod.name}'!`)
			console.error(err)
			debugger
		}
	})
)
