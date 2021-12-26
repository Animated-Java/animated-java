import { api as mc } from './entry'
import { File } from './file'
const tagLoopup = {
	blocks: 'blocks',
	entities: 'entity_types',
	fluids: 'fluids',
	functions: 'functions',
	items: 'items',
}
let state = {}
const path = {
	resolve(...args) {
		return args.join('/')
	},
}
const process = {
	cwd() {
		return '.'
	},
}
const evaluate = (line, token) => {
	try {
		return mc.transpiler.evaluators.code.evaluateCodeWithEnv(
			`return ${line}`,
			mc.getEnv()
		)
	} catch (e) {
		return true
	}
}
function targetedJSONAction(trigger, getPath) {
	return {
		match: ({ token }) => token.startsWith(trigger),
		exec(_, tokens) {
			const { token } = tokens.shift()
			const firstSpace = token.indexOf(' ') + 1
			const name = token.substr(firstSpace, token.length)
			const file = new File()
			file.setPath(mc.transpiler.evaluate_str(getPath(name, _)))
			mc.transpiler.validate_next_destructive(tokens, '{')
			let count = 1
			let content = ['{']
			while (count && tokens.length) {
				const item = tokens.shift().token
				content.push(mc.transpiler.evaluate_str(item))
				if (item === '{') count++
				if (item === '}') count--
			}
			file.setContents(content.join(''))
			file.confirm()
		},
	}
}
const tagConsumer = mc.transpiler.list({
	getToken: (list) => list[0],
	actions: [
		{
			match: ({ token }) => /^LOOP/.test(token),
			exec(file, tokens, tag) {
				const { token } = tokens.shift()
				mc.transpiler.consumer.Loop(
					file,
					token,
					tokens,
					tag,
					tagConsumer
				)
			},
		},
		{
			match: ({ token }) => /^!IF\(/.test(token),
			exec(file, tokens, tag) {
				const _token = tokens.shift()
				const { token } = _token
				const condition = token.substr(4, token.length - 5)
				tokens.shift()
				mc.transpiler.validate_next_destructive(tokens, '{')
				if (evaluate(condition, _token)) {
					while (tokens[0].token != '}') {
						tagConsumer(file, tokens, tag)
					}
					mc.transpiler.validate_next_destructive(tokens, '}')
				} else {
					let count = 1
					while (count && tokens.length) {
						let item = tokens.shift().token
						if (item === '{') count++
						if (item === '}') count--
					}
				}
			},
		},
		{
			match: ({ token }) => /^!.+/.test(token),
			exec(file, tokens, tag) {
				const { token } = tokens[0]
				const condition = token.substr(1)
				tokens.shift()
				mc.transpiler.validate_next_destructive(tokens, '{')
				if (evaluate(condition)) {
					while (tokens[0].token != '}') {
						tagConsumer(file, tokens, tag)
					}
					mc.transpiler.validate_next_destructive(tokens, '}')
				} else {
					let count = 1
					while (count && tokens.length) {
						let item = tokens.shift().token
						if (item === '{') count++
						if (item === '}') count--
					}
				}
			},
		},
	],
	def: (file, tokens, tag) => {
		const { token } = tokens.shift()
		tag.values.add(mc.transpiler.evaluate_str(token))
	},
})
const transpiler = mc.transpiler
const GenericConsumer = transpiler.consumer.Generic
const EntryConsumer = transpiler.consumer.EntryOp
GenericConsumer.addAction({
	match: ({ token }) => token.startsWith('tags'),
	exec(file, tokens, func) {
		const _token = tokens.shift()
		const { token } = _token
		// tags bla add stone;
		const [, name, action, value] = token.split(/\s+/)
		switch (action) {
			case 'add':
				state.tags[name].values.add(mc.transpiler.evaluate_str(value))
				break
			default:
				throw new CompilerError(
					`invalid tag action '${action}'`,
					_token.line
				)
		}
	},
})
EntryConsumer.addAction({
	match: ({ token }) =>
		/^(blocks|entities|fluids|functions|items)/.test(token),
	exec(file, tokens) {
		const { token } = tokens.shift()
		const [type, name, replace] = token.split(/\s+/)
		const tag = (state.tags[mc.transpiler.evaluate_str(name)] = {
			type: tagLoopup[type],
			replace: replace === 'replace',
			values: new Set(),
			namespace: mc.getNamespace(),
		})
		mc.transpiler.validate_next_destructive(tokens, '{')
		while (tokens[0].token != '}') {
			tagConsumer(file, tokens, tag)
		}
		tokens.shift()
	},
})
EntryConsumer.addAction(
	targetedJSONAction('loot', (name) => {
		const namespace = mc.getNamespace()
		return path.resolve(
			'data',
			namespace.namespace,
			'loot_tables',
			namespace.path + name + '.json'
		)
	})
)
EntryConsumer.addAction(
	targetedJSONAction('predicate', (name) => {
		const namespace = mc.getNamespace()
		return path.resolve(
			process.cwd(),
			'data',
			namespace.namespace,
			'predicates',
			namespace.path + name + '.json'
		)
	})
)
EntryConsumer.addAction(
	targetedJSONAction('modifier', (name) => {
		const namespace = mc.getNamespace()
		return path.resolve(
			process.cwd(),
			'data',
			namespace.namespace,
			'item_modifiers',
			namespace.path + name + '.json'
		)
	})
)
EntryConsumer.addAction(
	targetedJSONAction('recipe', (name) => {
		const namespace = mc.getNamespace()
		return path.resolve(
			process.cwd(),
			'data',
			namespace.namespace,
			'recipes',
			namespace.path + name + '.json'
		)
	})
)
EntryConsumer.addAction(
	targetedJSONAction('advancement', (name) => {
		const namespace = mc.getNamespace()
		return path.resolve(
			process.cwd(),
			'data',
			namespace.namespace,
			'advancements',
			namespace.path + name + '.json'
		)
	})
)
mc.on('start', (e) => {
	state = {
		tags: {},
	}
})
mc.on('end', (e) => {
	for (const name in state.tags) {
		const tag = state.tags[name]
		const file = new File()
		file.setPath(
			path.resolve(
				process.cwd(),
				'data',
				tag.namespace.namespace,
				'tags',
				tag.type,
				tag.namespace.path + name + '.json'
			)
		)
		file.setContents(
			JSON.stringify({
				replace: tag.replace,
				values: Array.from(tag.values),
			})
		)
		file.confirm()
	}
})
