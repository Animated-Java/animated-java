import CONFIG from './config'
import logger from './log'
import { CompilerError, UserError } from './errors'
// const { File } = require('./file.js')
import { evaluateCodeWithEnv, bindCodeToEnv } from './code-runner'
// const { evaluateCodeWithEnv } = require('./code-runner.js')
// const MC_LANG_EVENTS = require('./events.js')
import MC_LANG_EVENTS from './events'
// const io = require('./io.js')
import io from './io'
const { MCFunction, loadFunction, tickFunction, evaluate_str } = io
const consumer = {}
let LB_TOTAL = 0
let LB_current = 0
let lastSendTime = 0
function shift_t(tok) {
	LB_current++
	if (lastSendTime + 50 < Date.now()) {
		postMessage({
			type: 'progress',
			total: LB_TOTAL,
			current: LB_current,
			percent: LB_current / LB_TOTAL,
			token: tok[0],
		})
		lastSendTime = Date.now()
	}
	return tok.shift()
}
let id = 0
let env = {}
let namespaceStack = []
let MacroCache = {}
let Macros = {}
let LoadFunction = null
let TickFunction = null
let MacroStorage = {}
let scoreIds = new Map()
function flat(arr, r) {
	let res = r || []
	for (let i = 0; i < arr.length; i++) {
		if (Array.isArray(arr[i])) {
			flat(arr[i], res)
		} else {
			res.push(arr[i])
		}
	}
	return res
}
function getUniqueScoreId(file) {
	const ids = flat(Array.from(scoreIds.values()))
	for (let i = 0; i < ids.length + 1; i++) {
		if (!ids.includes(i)) {
			const arr = scoreIds.get(file) || []
			arr.push(i)
			scoreIds.set(file, arr)
			return i
		}
	}
}
function resetScoreIdsForFile(file) {
	scoreIds.delete(file)
}
const evaluate = (line, token) => {
	try {
		return evaluateCodeWithEnv(`return ${line}`, {
			...env,
			args: token.args,
			storage: MacroStorage[token.file || 'mc'],
			type: (index) => token.args[index].type,
		})
		// return new Function("type", "return " + line).bind(env)((index, type) => token.args[index].type === type);
	} catch (e) {
		throw new CompilerError(e.message, token.line)
	}
}
// let logged = false
class Token {
	constructor(line, token, log) {
		this.line = line
		this.token = token
		// if (!log && !logged) {
		// 	logged = true
		// 	console.trace(this)
		// 	debugger
		// }
	}
	[Symbol.toStringTag]() {
		return this.token
	}
}

const tokenize = (str) => {
	let inML = false
	return str.split('\n').reduce((p, n, index) => {
		n = n.trim()
		if (n.startsWith('###')) inML = !inML
		if (inML || n[0] === '#' || !n) return p
		if (n[0] === '\\' && n[1] == '#') n = n.slice(1)
		if (n[0] === '}') {
			p.push(new Token(index, '}', true))
			n = n.slice(1)
		}
		if (n[n.length - 1] === '{') {
			const v = n.slice(0, n.length - 1).trim()
			if (v) p.push(new Token(index, v, true))
			p.push(new Token(index, '{', true))
		} else if (n) {
			p.push(new Token(index, n, true))
		}
		return p
	}, [])
}

function validate_next_destructive(tokens, expect) {
	const token = shift_t(tokens)
	if (token && token.token != expect) {
		throw new CompilerError(
			`unexpected token '${token.token}' expected '${expect}'`,
			token.line
		)
	}
}
function list({ getToken, actions, def }) {
	const invoker = (file, tokens, ...args) => {
		const token = invoker.getToken(tokens)
		const action = invoker.actions.find((action) => action.match(token))
		if (!action) {
			return invoker.def(file, tokens, ...args)
		} else {
			return action.exec(file, tokens, ...args)
		}
	}
	invoker.actions = actions.map((action, index) => {
		action.priority = index
		return action
	})
	invoker.def = def
	invoker.getToken = getToken
	invoker.addAction = (action, priority = invoker.actions.length) => {
		action.priority = priority
		invoker.actions = [action, ...invoker.actions].sort(
			(a, b) => a.priority - b.priority
		)
	}
	return invoker
}
consumer.Namespace = (file, token, tokens) => {
	const name = evaluate_str(token.substr('dir '.length))
	if (/[^a-z0-9_\.]/.test(name)) {
		throw new CompilerError(
			"invalid directory name '" + name + "'",
			token.line
		)
	}
	namespaceStack.push(name.trim())
	validate_next_destructive(tokens, '{')
	while (tokens[0].token != '}') {
		consumer.Entry(file, tokens, true)
	}
	validate_next_destructive(tokens, '}')
	namespaceStack.pop()
}
consumer.EntryOp = list({
	getToken: (tokenlist) => tokenlist[0],
	actions: [
		{
			match: ({ token }) => /dir .+/.test(token),
			exec(file, tokens) {
				consumer.Namespace(file, shift_t(tokens).token, tokens)
			},
		},
		{
			match: ({ token }) => /function .+/.test(token),
			exec(file, tokens) {
				consumer.Function(file, tokens)
			},
		},
		{
			match: ({ token }) => /clock .+/.test(token),
			exec(file, tokens) {
				const { token } = tokens[0]
				const time = token.substr(6)
				shift_t(tokens)
				const func = consumer.Block(file, tokens, 'clock', {
					prepend: ['schedule function $block ' + time],
				})
				loadFunction.set(file, func.substr(9))
			},
		},
		{
			match: ({ token }) => /^LOOP/.test(token),
			exec(file, tokens) {
				const _token = shift_t(tokens)
				consumer.Loop(file, _token.token, tokens, true, consumer.Entry)
			},
		},
		{
			match: ({ token }) => /^!IF\(/.test(token),
			exec(file, tokens) {
				const _token = shift_t(tokens)
				const { token } = _token
				const condition = token.substr(4, token.length - 5)
				validate_next_destructive(tokens, '{')
				if (evaluate(condition, _token)) {
					while (tokens[0].token != '}') {
						consumer.Entry(file, tokens, true)
					}
					validate_next_destructive(tokens, '}')
				} else {
					let count = 1
					while (count && tokens.length) {
						let item = shift_t(tokens).token
						if (item === '{') count++
						if (item === '}') count--
					}
				}
			},
		},
		{
			match: ({ token }) => /^!.+/.test(token),
			exec(file, tokens) {
				const _token = tokens[0]
				const { token } = _token
				const condition = token.substr(1)
				shift_t(tokens)
				validate_next_destructive(tokens, '{')
				if (evaluate(condition, _token)) {
					while (tokens[0].token != '}') {
						consumer.Entry(file, tokens, true)
					}
					validate_next_destructive(tokens, '}')
				} else {
					let count = 1
					while (count && tokens.length) {
						let item = shift_t(tokens).token
						if (item === '{') count++
						if (item === '}') count--
					}
				}
			},
		},
	],
	def: (file, tokens) => {
		const token = shift_t(tokens)
		throw new CompilerError(
			`unexpected token '${token.token}' before ${
				tokens[0]
					? tokens[0].token.length > 10
						? tokens[0].token.substr(0, 10) + '...'
						: tokens[0].token
					: 'EOF'
			}`,
			token.line
		)
	},
})
consumer.Entry = (file, tokens, once) => {
	if (once) {
		consumer.EntryOp(file, tokens)
	} else {
		while (tokens[0]) {
			consumer.EntryOp(file, tokens)
		}
	}
}

consumer.Function = (file, tokens, opts = {}) => {
	const definition = shift_t(tokens)
	let name = definition.token.substr(9)
	name = evaluate_str(name)
	if (/[^a-z0-9_\.]/.test(name)) {
		throw new CompilerError(
			"invalid function name '" + name + "'",
			definition.line
		)
	}
	const func = new MCFunction(undefined, undefined, name)
	func.namespace = namespaceStack[0]
	func.setPath(namespaceStack.slice(1).concat(name).join('/'))
	validate_next_destructive(tokens, '{')
	while (tokens[0].token != '}' && tokens[0]) {
		consumer.Generic(file, tokens, func, func, func)
	}
	validate_next_destructive(tokens, '}')
	if (opts.append) {
		for (let command of opts.append) {
			func.addCommand(command)
		}
	}
	func.confirm(file)
	return func
}
consumer.Generic = list({
	getToken: (list) => list[0],
	actions: [
		{
			match: ({ token }) => token === 'load',
			exec(file, tokens) {
				shift_t(tokens)
				const contents = consumer.Block(
					file,
					tokens,
					'load',
					{ dummy: true },
					null,
					null
				)
				for (let i = 0; i < contents.functions.length; i++) {
					LoadFunction.addCommand(contents.functions[i])
				}
			},
		},
		{
			match: ({ token }) => token === 'tick',
			exec(file, tokens) {
				shift_t(tokens)
				const contents = consumer.Block(
					file,
					tokens,
					'tick',
					{ dummy: true },
					null,
					null
				)
				for (let i = 0; i < contents.functions.length; i++) {
					TickFunction.addCommand(contents.functions[i])
				}
			},
		},
		{
			match: ({ token }) => token.startsWith('warn '),
			exec(file, tokens) {
				const { token } = shift_t(tokens)
				logger.warn(evaluate_str(token.substr(5).trim()))
			},
		},
		{
			match: ({ token }) => token.startsWith('error '),
			exec(file, tokens) {
				const _token = shift_t(tokens)
				const { token } = _token
				throw new UserError(token.substr(5).trim(), _token.line)
			},
		},
		{
			match: ({ token }) => /^execute\s*\(/.test(token),
			exec(file, tokens, func, parent, functionalparent) {
				let { token } = shift_t(tokens)
				let condition = token.substring(
					token.indexOf('(') + 1,
					token.length - 1
				)
				func.addCommand(
					`scoreboard players set #execute ${CONFIG.internalScoreboard} 0`
				)
				func.addCommand(
					`execute ${condition} run ${consumer.Block(
						file,
						tokens,
						'conditional',
						{
							append: [
								`scoreboard players set #execute ${CONFIG.internalScoreboard} 1`,
							],
						},
						parent,
						functionalparent
					)}`
				)
				while (/^else execute\s*\(/.test(tokens[0].token)) {
					token = shift_t(tokens).token
					condition = token.substring(
						token.indexOf('(') + 1,
						token.length - 1
					)
					func.addCommand(
						`execute if score #execute ${
							CONFIG.internalScoreboard
						} matches 0 ${condition} run ${consumer.Block(
							file,
							tokens,
							'conditional',
							{
								append: [
									`scoreboard players set #execute ${CONFIG.internalScoreboard} 1`,
								],
							},
							parent,
							functionalparent
						)}`
					)
				}
				if (/^else/.test(tokens[0].token)) {
					shift_t(tokens)
					func.addCommand(
						`execute if score #execute ${
							CONFIG.internalScoreboard
						} matches 0 run ${consumer.Block(
							file,
							tokens,
							'conditional',
							{},
							parent,
							functionalparent
						)}`
					)
				}
			},
		},
		{
			match: ({ token }) => /^!IF\(/.test(token),
			exec(file, tokens, func) {
				const _token = shift_t(tokens)
				const { token } = _token
				const condition = token.substr(4, token.length - 5)
				validate_next_destructive(tokens, '{')
				if (evaluate(condition, _token)) {
					while (tokens[0].token != '}') {
						consumer.Generic(file, tokens, func)
					}
					validate_next_destructive(tokens, '}')
				} else {
					let count = 1
					while (count && tokens.length) {
						let item = shift_t(tokens).token
						if (item === '{') count++
						if (item === '}') count--
					}
				}
			},
		},
		{
			match: ({ token }) => /^!.+/.test(token),
			exec(file, tokens, func) {
				const _token = shift_t(tokens)
				const { token } = _token
				const condition = token.substr(1)
				validate_next_destructive(tokens, '{')
				if (evaluate(condition, _token)) {
					while (tokens[0].token != '}') {
						consumer.Generic(file, tokens, func)
					}
					validate_next_destructive(tokens, '}')
				} else {
					let count = 1
					while (count && tokens.length) {
						let item = shift_t(tokens).token
						if (item === '{') count++
						if (item === '}') count--
					}
				}
			},
		},
		{
			match: ({ token }) => /^block|^{/.test(token),
			exec(file, tokens, func, parent) {
				if (tokens[0].token === 'block') shift_t(tokens)
				func.addCommand(
					consumer.Block(file, tokens, 'block', {}, parent, null)
				)
			},
		},
		{
			match: ({ token }) =>
				token.startsWith('execute') && token.indexOf('run') != -1,
			exec(file, tokens, func, parent, functionalparent) {
				debugger
				const _token = shift_t(tokens)
				const { token } = _token
				const command = token
					.substr(token.lastIndexOf('run') + 3)
					.trim()
				const execute = token
					.substr(0, token.lastIndexOf('run') + 3)
					.trim()
				let useAltParent = true
				if (!command) {
					useAltParent = false
					let lastInLine = _token
					for (let i = 0; i < tokens.length; i++) {
						if (tokens[i].line === lastInLine.line) {
							lastInLine = tokens[i]
						} else {
							break
						}
					}
					const temp = []
					let inner_count = 0
					let count = 1
					if (lastInLine && lastInLine.token === '{') {
						let tok = shift_t(tokens)
						temp.push(tok)
						while (
							(tokens.length && count) ||
							tok.line == tokens[0].line
						) {
							if (tokens[0].token === '}') count--
							if (tokens[0].token === '{') count++
							else if (count > 0) inner_count++
							tok = shift_t(tokens)
							temp.push(tok)
						}
					}
					if (inner_count === 1) {
						func.addCommand(execute + ' ' + temp[1].token)
						return
					}
					// let copy = copy_token(_token, _token.args)
					// copy.token = '}'
					// copy = copy_token(_token, _token.args)
					// tokens.unshift(copy)
					// copy.token = command
					// copy = copy_token(_token, _token.args)
					// tokens.unshift(copy)
					// copy.token = '{'
					tokens.unshift(...temp)
					LB_TOTAL += temp.length
					const innerFunc = consumer.Block(
						file,
						tokens,
						'execute',
						{
							dummy: true,
						},
						useAltParent ? parent : func,
						useAltParent ? functionalparent : func
					)
					innerFunc.confirm(file)
					func.addCommand(
						execute + ' function ' + innerFunc.getReference()
					)
				} else {
					func.addCommand(token)
				}
			},
		},
		{
			match: ({ token }) => /^LOOP/.test(token),
			exec(file, tokens, func) {
				const { token } = shift_t(tokens)
				consumer.Loop(
					file,
					token,
					tokens,
					func,
					consumer.Generic,
					null,
					null
				)
			},
		},
		{
			match: ({ token }) => /until\s*\(/.test(token),
			exec(file, tokens, func, parent, functionalparent) {
				const { token } = shift_t(tokens)
				const args = token.substr(6, token.length - 7)
				const cond = args.substr(0, args.lastIndexOf(',')).trim()
				const time = args.substr(args.lastIndexOf(',') + 1).trim()
				const _id = getUniqueScoreId(file)
				const call = consumer.Block(
					file,
					tokens,
					'until',
					{
						prepend: [
							`scoreboard players set #until_${_id} ${CONFIG.internalScoreboard} 1`,
						],
					},
					parent,
					null
				)
				const untilFunc = new MCFunction()
				const name =
					CONFIG.generatedDirectory +
					'/until/' +
					(id.until = (id.until == undefined ? -1 : id.until) + 1)
				untilFunc.namespace = namespaceStack[0]
				untilFunc.setPath(
					namespaceStack.slice(1).concat(name).join('/')
				)
				untilFunc.addCommand(
					`scoreboard players set #until_${_id} ${CONFIG.internalScoreboard} 0`
				)
				untilFunc.addCommand(`execute ${cond} run ${call}`)
				untilFunc.addCommand(
					`execute if score #until_${_id} ${CONFIG.internalScoreboard} matches 0 run schedule function $block ${time}`
				)
				untilFunc.confirm(file)
				func.addCommand(`function ${untilFunc.getReference()}`)
			},
		},
		{
			match: ({ token }) => /^async while/.test(token),
			exec(file, tokens, func, parent) {
				let { token } = shift_t(tokens)
				const args = token.substr(12, token.length - 13)
				const cond = args.substr(0, args.lastIndexOf(',')).trim()
				const time = args.substr(args.lastIndexOf(',') + 1).trim()
				const whileFunc = new MCFunction()
				const _id = getUniqueScoreId(file)
				const name =
					CONFIG.generatedDirectory +
					'/while/' +
					(id.while = (id.while == undefined ? -1 : id.while) + 1)

				whileFunc.namespace = namespaceStack[0]
				whileFunc.setPath(
					namespaceStack.slice(1).concat(name).join('/')
				)
				const whileAction = consumer.Block(
					file,
					tokens,
					'while',
					{
						append: [
							`scoreboard players set #WHILE_${_id} ${CONFIG.internalScoreboard} 1`,
							`schedule function ${whileFunc.getReference()} ${time}`,
						],
					},
					parent,
					func
				)
				whileFunc.addCommand(
					`scoreboard players set #WHILE_${_id} ${CONFIG.internalScoreboard} 0`
				)
				whileFunc.addCommand(`execute ${cond} run ${whileAction}`)

				if (/^finally$/.test(tokens[0].token)) {
					token = shift_t(tokens).token
					const whileFinally = consumer.Block(
						file,
						tokens,
						'while',
						{},
						whileFunc,
						func
					)
					whileFunc.addCommand(
						`execute if score #WHILE_${_id} ${CONFIG.internalScoreboard} matches 0 run ${whileFinally}`
					)
				}

				whileFunc.confirm(file)
				func.addCommand(`function ${whileFunc.getReference()}`)
			},
		},
		{
			match: ({ token }) => /^while/.test(token),
			exec(file, tokens, func, parent) {
				let { token } = shift_t(tokens)
				const args = token.substr(6, token.length - 7)
				const cond = args.trim()
				const whileFunc = new MCFunction()
				const name =
					CONFIG.generatedDirectory +
					'/while/' +
					(id.while = (id.while == undefined ? -1 : id.while) + 1)

				const _id = getUniqueScoreId(file)
				whileFunc.namespace = namespaceStack[0]
				whileFunc.setPath(
					namespaceStack.slice(1).concat(name).join('/')
				)
				const whileAction = consumer.Block(
					file,
					tokens,
					'while',
					{
						append: [
							`scoreboard players set #WHILE_${_id} ${CONFIG.internalScoreboard} 1`,
							`function ${whileFunc.getReference()}`,
						],
					},
					parent,
					func
				)
				whileFunc.addCommand(
					`scoreboard players set #WHILE_${_id} ${CONFIG.internalScoreboard} 0`
				)
				whileFunc.addCommand(`execute ${cond} run ${whileAction}`)

				if (/^finally$/.test(tokens[0].token)) {
					token = shift_t(tokens).token
					const whileFinally = consumer.Block(
						file,
						tokens,
						'while',
						{},
						whileFunc,
						func
					)
					whileFunc.addCommand(
						`execute if score #WHILE_${_id} ${CONFIG.internalScoreboard} matches 0 run ${whileFinally}`
					)
				}

				whileFunc.confirm(file)
				func.addCommand(`function ${whileFunc.getReference()}`)
			},
		},
		{
			match: ({ token }) =>
				/^schedule\s?((\d|\.)+(d|t|s)|<%.+)\s?(append|replace){0,1}$/.test(
					token
				),
			exec(file, tokens, func, parent, functionalparent) {
				const { token } = shift_t(tokens)
				const inner_func = consumer.Block(
					file,
					tokens,
					'schedule',
					{},
					parent,
					functionalparent
				)
				const [, time, type] = evaluate_str(token).split(/\s+/)
				func.addCommand(`schedule ${inner_func} ${time} ${type}`.trim())
			},
		},
		{
			match: ({ token }) => token === 'sequence',
			exec(file, tokens, func) {
				shift_t(tokens)
				const contents = consumer.Block(
					file,
					tokens,
					'sequence',
					{ dummy: true },
					null,
					null
				)
				const timeToTicks = (time) => {
					let val = +time.substr(0, time.length - 1)
					let type = time[time.length - 1]
					switch (type) {
						case 's':
							val *= 20
							break
						case 'd':
							val *= 24000
							break
					}
					return val
				}

				const commands = {}
				let time = 0
				for (let command of contents.functions) {
					if (command.startsWith('delay')) {
						let delay = timeToTicks(command.substr(6).trim())
						time += delay
					} else if (command.startsWith('setdelay')) {
						let delay = timeToTicks(command.substr(9).trim())
						time = delay
					} else {
						commands[time] = commands[time] || []
						commands[time].push(command)
					}
				}
				for (let time in commands) {
					if (time == 0) {
						for (const command of commands[time])
							func.addCommand(command)
					} else {
						const subfunc = new MCFunction()
						const name =
							CONFIG.generatedDirectory +
							'/sequence/' +
							(id.sequence =
								(id.sequence == undefined ? -1 : id.sequence) +
								1)
						subfunc.namespace = namespaceStack[0]
						subfunc.setPath(
							namespaceStack.slice(1).concat(name).join('/')
						)
						for (const command of commands[time])
							subfunc.addCommand(command)
						func.addCommand(
							`schedule ${subfunc.toString()} ${time}t replace`
						)
						subfunc.confirm()
					}
				}
			},
		},
		{
			match: ({ token }) => token === '(',
			exec(file, tokens, func) {
				shift_t(tokens)
				let items = ''
				let next = shift_t(tokens)
				while (next.token != ')') {
					items += next.token + ' '
					next = shift_t(tokens)
				}
				func.addCommand(items.trim())
			},
		},
	],
	def(file, tokens, func, parent, functionalparent) {
		const _token = shift_t(tokens)
		const { token } = _token
		func.addCommand(token)
	},
})

consumer.Block = (
	file,
	tokens,
	reason,
	opts = {},
	parent,
	functionalparent
) => {
	validate_next_destructive(tokens, '{')
	if (!reason) reason = 'none'
	// just a clever way to only allocate a number if the namespace is used, allows me to define more namespaces as time goes on
	let name = null
	if (tokens[0].token.startsWith('name ')) {
		const special_thing = shift_t(tokens).token
		name = evaluate_str(special_thing.substr(5)).trim()
	} else {
		name =
			CONFIG.generatedDirectory +
			'/' +
			reason +
			'/' +
			(id[reason] = (id[reason] == undefined ? -1 : id[reason]) + 1)
	}
	const func = new MCFunction(parent, functionalparent)
	if (functionalparent === null) {
		functionalparent = func
	}
	// func.namespace = path.parse(file).name;
	// func.setPath(name);
	func.namespace = namespaceStack[0]
	func.setPath(namespaceStack.slice(1).concat(name).join('/'))
	if (opts.prepend) {
		for (let command of opts.prepend) {
			func.addCommand(command)
		}
	}
	while (tokens[0].token != '}' && tokens[0]) {
		consumer.Generic(
			file,
			tokens,
			func,
			func,
			reason == 'conditional' ? functionalparent : func
		)
	}
	if (opts.append) {
		for (let command of opts.append) {
			func.addCommand(command)
		}
	}
	validate_next_destructive(tokens, '}')
	if (!opts.dummy) {
		func.confirm(file)
		return func.toString()
	} else {
		return func
	}
}

consumer.Loop = (
	file,
	token,
	tokens,
	func,
	type = consumer.Generic,
	parent,
	functionalparent
) => {
	let [count, name] = token
		.substring(token.indexOf('(') + 1, token.length - 1)
		.split(',')
		.map((_) => _.trim())
	if (token.indexOf('[') != -1) {
		const parts = token
			.substring(token.indexOf('(') + 1, token.length - 1)
			.split(',')
		name = parts.pop()
		count = parts.join(',')
	}
	count = evaluate(count, token)
	validate_next_destructive(tokens, '{')
	if (Array.isArray(count)) {
		for (let i = 0; i < count.length - 1; i++) {
			const copy = [...tokens]
			env[name] = count[i]
			while (copy[0].token != '}' && copy.length) {
				type(file, copy, func, parent, functionalparent)
			}
		}
		env[name] = count[count.length - 1]
	} else {
		for (let i = 0; i < count - 1; i++) {
			const copy = [...tokens]
			env[name] = i
			while (copy[0].token != '}' && copy.length) {
				type(file, copy, func, parent, functionalparent)
			}
		}
		env[name] = count - 1
	}
	while (tokens[0].token != '}' && tokens.length) {
		type(file, tokens, func, parent, functionalparent)
	}
	validate_next_destructive(tokens, '}')
	delete env[name]
}

function copy_token(_, args) {
	let t = new Token(_.line, _.token)
	t.file = _.file
	t.args = args
	t.dependencies = _.dependencies
	return t
}
const TickTag = new io.MultiFileTag('./data/minecraft/tags/functions/tick.json')
const LoadTag = new io.MultiFileTag('./data/minecraft/tags/functions/load.json')

function MC_LANG_HANDLER(file_contents, namespace, config, info) {
	if (config) {
		Object.assign(CONFIG, config)
	}
	//? entry point of the whole thing; `file` is the filepath to a source file (one that ends with .mc)
	let file = 'dummy'
	MC_LANG_EVENTS.emit('start')
	resetScoreIdsForFile(file)
	hashes = new Map()
	Macros = {}
	included_file_list = []
	namespaceStack = [namespace]
	if (Array.isArray(info)) {
		namespaceStack.push(...info)
	}
	if (CONFIG.defaultNamespace) {
		namespaceStack.unshift(CONFIG.defaultNamespace)
	}
	LoadFunction = new MCFunction(null, null, 'load')
	LoadFunction.namespace = namespaceStack[0]
	LoadFunction.setPath(
		namespaceStack
			.slice(1)
			.concat(CONFIG.generatedDirectory + '/load')
			.join('/')
	)
	TickFunction = new MCFunction(null, null, 'tick')
	TickFunction.namespace = namespaceStack[0]
	TickFunction.setPath(
		namespaceStack
			.slice(1)
			.concat(CONFIG.generatedDirectory + '/tick')
			.join('/')
	)
	loadFunction.reset(file)
	tickFunction.reset(file)
	LoadTag.reset(file)
	TickTag.reset(file)
	MacroStorage = {}
	env = { config: CONFIG, file_path: file }
	MCFunction.setEnv(env)
	ifId = 0
	id = {}
	try {
		let tokens = tokenize(file_contents)
		LB_TOTAL = tokens.length
		consumer.Entry(file, tokens)
		if (LoadFunction.functions.length > 0) {
			LoadFunction.functions = Array.from(
				new Set(LoadFunction.functions).keys()
			)
			LoadFunction.confirm(file)
		}
		if (TickFunction.functions.length > 0) {
			TickFunction.confirm(file)
		}
		const loadContent = loadFunction.valuesFor(file)
		if (loadContent.length > 0) {
			LoadTag.set(file, loadContent)
		}
		const tickValues = tickFunction.valuesFor(file)
		if (tickValues.length > 0) {
			TickTag.set(file, tickValues)
		}
		MC_LANG_EVENTS.emit('end')
	} catch (e) {
		MC_LANG_EVENTS.emit(e.message)
		if (e.message === "Cannot read property 'token' of undefined") {
			throw new CompilerError('expected more tokens', 'EOF')
		} else {
			throw e
		}
	}
}

export { MC_LANG_HANDLER as compile }
export const api = {
	on(event, handler) {
		MC_LANG_EVENTS.on(event, handler)
	},
	io: {
		loadFunction,
		tickFunction,
		TickTag,
		LoadTag,
		MCFunction,
	},
	getEnv() {
		return env
	},
	getNamespace(type) {
		const end = namespaceStack.slice(1).join('/')
		return {
			namespace: namespaceStack[0],
			path: end + (end.length === 0 ? '' : '/'),
		}
	},
	transpiler: {
		tokenize,
		evaluate_str,
		consumer,
		validate_next_destructive,
		list,
		evaluators: {
			code: {
				evaluateCodeWithEnv: evaluateCodeWithEnv,
				getFunctionWithEnv: bindCodeToEnv,
			},
		},
	},
}
