import { NBT } from './nbt'
import { namespacedID } from './types'

type gamemode = 'survival' | 'creative' | 'spectator' | 'adventure'

type rangeableNumber = number | `${number}..${number}` | `${number}..` | `..${number}`

type scoreObject = {
	[index: string]: rangeableNumber
}

type entitySelectorScope =
	| 'thisEntity'
	| 'randomEntity'
	| 'allEntities'
	| 'allPlayers'
	| 'nearestPlayer'

type entitySelectorOptions = {
	type?: namespacedID
	tags?: string[]
	scores?: scoreObject
	x?: number
	y?: number
	z?: number
	distance?: rangeableNumber
	dx?: number
	dy?: number
	dz?: number
	team?: string
	limit?: number
	sort?: 'nearest' | 'furthest' | 'random' | 'arbitrary'
	level?: rangeableNumber
	gamemode?: gamemode
	name?: string
	x_rotation?: number
	y_rotation?: number
	z_rotation?: number
	nbt?: NBT<unknown>
}

class EntitySelector {
	public scope: entitySelectorScope
	public options: entitySelectorOptions
	constructor(scope: entitySelectorScope, options: entitySelectorOptions) {
		this.scope = scope
		this.options = options
	}
	toString() {
		let str = `@`
		switch (this.scope) {
			case 'thisEntity':
				str += 's'
				break
			case 'randomEntity':
				str += 'r'
				break
			case 'nearestPlayer':
				str += 'p'
				break
			case 'allEntities':
				str += 'e'
				break
			case 'allPlayers':
				str += 'a'
				break
		}
		const args: string[] = []
		// Tags
		this.options.tags?.forEach(v => args.push(`tag=${v}`))
		// Scores
		if (Object.entries(this.options.scores).length) {
			args.push(
				'scores={' +
					Object.entries(this.options.scores)
						.map(([k, v]) => `${k}=${v}`)
						.join(',') +
					'}'
			)
		}
		return args.length ? str + `[${args.join(',')}]` : str
	}

	withTags(tags: string[]) {
		return new EntitySelector(this.scope, {
			tags: this.options.tags.concat(...tags),
			scores: this.options.scores,
		})
	}

	withScores(scores: scoreObject) {
		return new EntitySelector(this.scope, {
			tags: this.options.tags,
			scores: { ...this.options.scores, ...scores },
		})
	}
}

// const test = new EntitySelector('thisEntity', {
// 	tags: ['new', '!weirdo'],
// 	scores: { age: 0, id: '1..' },
// })
