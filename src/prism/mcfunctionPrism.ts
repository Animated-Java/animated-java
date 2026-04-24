// @ts-expect-error - Broken BB types
Prism.languages.mcfunction = {
	// Multi-line documentation style comment blocks beginning with #>, #!, or ##.
	'comment-block': {
		pattern: /^\s*#[>!#].*(?:\r?\n\s*#.*)*/m,
		greedy: true,
		inside: {
			heading: {
				pattern: /@\S+/,
				alias: 'important',
			},
			'resource-name': {
				pattern: /#?[a-z_][a-z0-9_.-]*:[a-z0-9_./-]+|#?[a-z0-9_.-]+\/[a-z0-9_.\-/]+/i,
				alias: 'function',
			},
			variable: /[#%$][A-Za-z0-9_.#%$]+/,
		},
	},

	// Regular comments (line start and inline).
	comment: {
		pattern: /#.*/,
		greedy: true,
	},

	// Resource identifiers such as namespace:path and tag/function paths.
	'resource-name': {
		pattern: /#?[a-z_][a-z0-9_.-]*:[a-z0-9_./-]+|#?[a-z0-9_.-]+\/[a-z0-9_.\-/]+/i,
		alias: 'function',
	},

	selector: {
		pattern: /@[a-z]+/,
		alias: 'class-name',
	},

	macro: {
		pattern: /\$\([A-Za-z0-9_]*\)/,
		inside: {
			punctuation: /^\$\(|\)$/,
			variable: /[A-Za-z0-9_]+/,
		},
	},

	string: [
		{
			pattern: /"(?:\\.|[^\\"\r\n])*"/,
			greedy: true,
			inside: {
				macro: {
					pattern: /\$\([A-Za-z0-9_]*\)/,
					inside: {
						punctuation: /^\$\(|\)$/,
						variable: /[A-Za-z0-9_]+/,
					},
				},
				escape: /\\./,
			},
		},
		{
			pattern: /'(?:\\.|[^\\'\r\n])*'/,
			greedy: true,
			inside: {
				macro: {
					pattern: /\$\([A-Za-z0-9_]*\)/,
					inside: {
						punctuation: /^\$\(|\)$/,
						variable: /[A-Za-z0-9_]+/,
					},
				},
				escape: /\\./,
			},
		},
	],

	boolean: /\b(?:true|false)\b/i,

	uuid: /\b[0-9a-fA-F]+(?:-[0-9a-fA-F]+){4}\b/,

	number: [/[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?[df]?\b/, /[+-]?\d+(?:[bBlLsS])?\b/],

	range: /\.\./,

	// Command words at line start and after run.
	keyword: [
		{
			pattern: /(^\s*)(?:[a-z_]+)(?=\s)/m,
			lookbehind: true,
		},
		{
			pattern: /(\brun\s+)(?:[a-z_]+)/,
			lookbehind: true,
		},
		/\bsay\b/,
	],

	// Property keys before =: or as bare identifiers in NBT-like structures.
	'attr-name': [
		{
			pattern: /\b#?[a-z_][a-z_\.\-]*:[a-z0-9_\.\-/]+(?=\s*=:)/i,
			alias: 'property',
		},
		{
			pattern: /\b#?[a-z_][a-z0-9_\.\-/]+\b/i,
			alias: 'property',
		},
		{
			pattern: /\b[A-Za-z_][A-Za-z_\-+]*\b/,
			alias: 'property',
		},
	],

	// Unquoted property-style values.
	'attr-value': {
		pattern: /\b#?[a-z_][a-z_\.\-]*:[a-z0-9_\.\-/]+\b|\b#?[a-z_][a-z0-9_\.\-/]+\b/i,
		alias: 'string',
	},

	operator: /[~^]|[\-%?!+*<>\\/|&=.:,;]/,

	punctuation: /[{}\[\]()]/,

	variable: /([#%$]|(?<=\s)\.)[A-Za-z0-9_.#%$\-]+/,

	name: {
		pattern: /[A-Za-z_][A-Za-z0-9_.#%$]*/,
		alias: 'symbol',
	},
}

// @ts-expect-error - Broken BB types
Prism.languages.bolt = Prism.languages.mcfunction
