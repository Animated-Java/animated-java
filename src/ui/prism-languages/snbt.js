;(function (Prism) {
	Prism.languages.snbt = {
		boolean: /\b(?:true|false)\b/,
		number: /-?\d+\.?\d*(e[+-]?\d+[IiBbFfSs]*)?/i,
		operator: /:/,
		property: { pattern: /(?:\\.|[^\{\\"\r\n])*(?=\s*:)/g },
		punctuation: /[{}[\],]/,
		string: {
			pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
			greedy: true,
		},
	}
})(globalThis.Prism)
