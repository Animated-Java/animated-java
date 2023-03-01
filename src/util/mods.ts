import { events } from './events'

interface BlockbenchModOptions<Context = any> {
	id: string
	context?: Context
	inject: (context: BlockbenchMod<Context>['context']) => void
	extract: (context: BlockbenchMod<Context>['context']) => void
}

export class BlockbenchMod<Context = any> {
	static all: BlockbenchMod[] = []
	name: string
	context: Context
	inject: BlockbenchModOptions<Context>['inject']
	extract: BlockbenchModOptions<Context>['extract']

	constructor(options: BlockbenchModOptions<Context>) {
		this.name = options.id
		this.context = options.context || ({} as Context)
		this.inject = options.inject
		this.extract = options.extract
		BlockbenchMod.all.push(this)
	}
}

events.loadMods.subscribe(() =>
	BlockbenchMod.all.forEach(mod => {
		try {
			mod.inject(mod.context)
		} catch (err) {
			console.log(`Unexpected Error while attempting to inject mod '${mod.name}'!`)
			console.error(err)
			debugger
		}
	})
)
events.unloadMods.subscribe(() =>
	BlockbenchMod.all.forEach(mod => {
		try {
			mod.extract(mod.context)
		} catch (err) {
			console.log(`Unexpected Error while attempting to extract mod '${mod.name}'!`)
			console.error(err)
			debugger
		}
	})
)
