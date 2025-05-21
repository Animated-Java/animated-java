Prism.languages.clike = {
	comment: [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true,
			greedy: true,
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true,
		},
	],
	string: {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true,
	},
	'class-name': {
		pattern:
			/(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/,
		},
	},
	keyword:
		/\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
	boolean: /\b(?:false|true)\b/,
	function: /\b\w+(?=\()/,
	number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
	operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
	punctuation: /[{}[\];(),.:]/,
}

Prism.languages.javascript = Prism.languages.extend('clike', {
	'class-name': [
		// @ts-expect-error
		Prism.languages.clike['class-name'],
		{
			pattern:
				/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
			lookbehind: true,
		},
	],
	keyword: [
		{
			pattern: /((?:^|\})\s*)catch\b/,
			lookbehind: true,
		},
		{
			pattern:
				/(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true,
		},
	],
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	function:
		/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	number: {
		pattern: RegExp(
			/(^|[^\w$])/.source +
				'(?:' +
				// constant
				(/NaN|Infinity/.source +
					'|' +
					// binary integer
					/0[bB][01]+(?:_[01]+)*n?/.source +
					'|' +
					// octal integer
					/0[oO][0-7]+(?:_[0-7]+)*n?/.source +
					'|' +
					// hexadecimal integer
					/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
					'|' +
					// decimal bigint
					/\d+(?:_\d+)*n/.source +
					'|' +
					// decimal number (integer or float) but no bigint
					/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/
						.source) +
				')' +
				/(?![\w$])/.source
		),
		lookbehind: true,
	},
	operator:
		/--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
})

// @ts-expect-error
Prism.languages.javascript['class-name'][0].pattern =
	/(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/

Prism.languages.insertBefore('javascript', 'keyword', {
	regex: {
		pattern: RegExp(
			// lookbehind
			/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
				// Regex pattern:
				// There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
				// classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
				// with the only syntax, so we have to define 2 different regex patterns.
				/\//.source +
				'(?:' +
				/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\[\r\n])+\/[dgimyus]{0,7}/.source +
				'|' +
				// `v` flag syntax. This supports 3 levels of nested character classes.
				/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/
					.source +
				')' +
				// lookahead
				/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
		),
		lookbehind: true,
		greedy: true,
		inside: {
			'regex-source': {
				pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
				lookbehind: true,
				alias: 'language-regex',
				inside: Prism.languages.regex,
			},
			'regex-delimiter': /^\/|\/$/,
			'regex-flags': /^[a-z]+$/,
		},
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern:
			/#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
		alias: 'function',
	},
	parameter: [
		{
			pattern:
				/(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
			lookbehind: true,
			inside: Prism.languages.javascript,
		},
		{
			pattern:
				/(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript,
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism.languages.javascript,
		},
		{
			pattern:
				/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism.languages.javascript,
		},
	],
	constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/,
})

Prism.languages.insertBefore('javascript', 'string', {
	hashbang: {
		pattern: /^#!.*/,
		greedy: true,
		alias: 'comment',
	},
	'template-string': {
		pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
		greedy: true,
		inside: {
			'template-punctuation': {
				pattern: /^`|`$/,
				alias: 'string',
			},
			interpolation: {
				pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
				lookbehind: true,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation',
					},
					rest: Prism.languages.javascript,
				},
			},
			string: /[\s\S]+/,
		},
	},
	'string-property': {
		pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
		lookbehind: true,
		greedy: true,
		alias: 'property',
	},
})

Prism.languages.insertBefore('javascript', 'operator', {
	'literal-property': {
		pattern:
			/((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
		lookbehind: true,
		alias: 'property',
	},
})

Prism.languages['mcfunction'] = {
	comment: {
		pattern: /^#.*/m,
		greedy: true,
	},
	string: {
		pattern: /"(?:\\.|[^\\"])*"/,
		greedy: true,
	},
	number: {
		pattern: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
		greedy: true,
	},
	boolean: {
		pattern: /\b(?:true|false)\b/,
		greedy: true,
	},
	uuid: {
		pattern: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/,
		greedy: true,
	},
	selector: {
		pattern: /@[a-z]/,
		greedy: true,
	},
	keyword: {
		pattern:
			/\b(?:execute|run|if|unless|function|schedule|tag|advancement|enchantment|item_modifier|loot_table|predicate|recipe|chat_type|damage_type|dimension|dimension_type|worldgen|block|tick|load|clock|REPEAT|IF|ELSE)\b/,
		greedy: true,
	},
	operator: {
		pattern: /[~%^?!+*<>\\/|&=.:,;-]/,
		greedy: true,
	},
	'macro-indicator': {
		pattern: /^[ \t]*\$/,
		alias: ['italic', 'operator'],
	},
	property: {
		pattern: /[a-z_][a-z0-9_]*\s*:/,
		greedy: true,
	},
	function: {
		pattern: /\b[a-z_][a-z0-9_]*\b/,
		greedy: true,
	},
}

Prism.languages['mc-build'] = {
	comment: {
		pattern: /^[ \t]*#.*/m,
		greedy: true,
	},
	'inline-js': {
		pattern: /<%[^%]+%>/,
		inside: {
			keyword: /<%|%>/,
			js: {
				pattern: /.+/,
				inside: Prism.languages.javascript,
			},
		},
	},
	'multiline-js': {
		pattern: /<%%[\s\S]*?%%>/,
		inside: {
			keyword: /<%%|%%>/,
			js: {
				pattern: /[\s\S]+/,
				inside: Prism.languages.javascript,
			},
		},
	},
	'schedule-block': {
		pattern: /^[ \t]*\$?schedule\s+(\d+(t|s|d))(?:\s+(replace|append))?\s*{[\s\S]*?^[ \t]*}$/m,
		inside: {
			operator: /\$(?=schedule)/,
			keyword: /^[ \t]*\$?schedule/,
			constant: /(\d+(t|s|d))/,
			'keyword-other': {
				pattern: /\b(replace|append)\b/,
				alias: 'keyword',
			},
			content: {
				pattern: /{[\s\S]*}/,
				get inside() {
					return Prism.languages['mc-build']
				},
			},
		},
	},
	'function-block': {
		pattern: /block\s*[a-z0-9_]*\s*{(?:$|({.+|with .+)$)/m,
		inside: {
			keyword: /^block/,
			entity: /[a-z0-9_]+/,
			content: {
				pattern: /{[\s\S]*}/,
				get inside() {
					return Prism.languages['mc-build']
				},
			},
		},
	},
	execute: {
		pattern:
			/((?: |^[ \t]*)(\$?execute\b)|(\belse \$?execute\b)|else)[\s\S]*?(?: |^[ \t]*)(\$?run\b)/m,
		inside: {
			keyword: /(\$?execute\b|\belse \$?execute\b|else|\$?run\b)/,
			operator: /\$/,
			content: {
				pattern: /[\s\S]+/,
				get inside() {
					return Prism.languages['mc-build']
				},
			},
		},
	},
	'execute-if-function': {
		pattern: /(if|unless)\s+function\s*{[\s\S]*?^[ \t]*}$/m,
		inside: {
			keyword: /(if|unless)/,
			entity: /function/,
			content: {
				pattern: /{[\s\S]*}/,
				get inside() {
					return Prism.languages['mc-build']
				},
			},
		},
	},
	'special-function-call': {
		pattern: /^[ \t]*function\s+#?(?:\*|\.?\.\/).+?(?: |$)/m,
		inside: {
			keyword: /^function/,
			entity: /#?(?:\*|\.?\.\/).+?(?: |$)/,
			content: {
				pattern: /.+/,
				get inside() {
					return Prism.languages['mc-build']
				},
			},
		},
	},
	...Prism.languages['mcfunction'],
}
