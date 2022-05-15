import { events } from './events'

interface BlockbenchModOptions {
	name: string
	inject: () => void
	extract: () => void
}

const all: BlockbenchMod[] = []

export class BlockbenchMod {
	name: string
	inject: BlockbenchModOptions['inject']
	extract: BlockbenchModOptions['extract']

	constructor(options: BlockbenchModOptions) {
		this.name = options.name
		this.inject = options.inject
		this.extract = options.extract
		all.push(this)
	}
}

events.loadMods.addListener(() =>
	all.forEach(mod => {
		try {
			mod.inject()
		} catch (err) {
			console.log(`Unexpected Error while attempting to inject Figura mod '${mod.name}' into Blockbench!`)
			console.error(err)
		}
	})
)
events.unloadMods.addListener(() =>
	all.forEach(mod => {
		try {
			mod.extract()
		} catch (err) {
			console.log(`Unexpected Error while attempting to extract Figura mod '${mod.name}' from Blockbench!`)
			console.error(err)
		}
	})
)
