/*!
 * "nbt-lint" NBT Text Library v1.2.1 | MIT License
 * https://github.com/AjaxGb/NBTLint
 *
 * Modified by Ian Senne (FetchBot) for animated java
 *
 * Changes:
 * - converted to an esmodule
 */

var nbtlint = {
	TagBase: function () {},
	quotedCharRE: /[^a-zA-Z0-9._+\-]/,
	/**
	 * An NBT String tag
	 * @constructor
	 * @param {string} value - The tag's value
	 * @param {boolean} [isKey=false] - Whether the string is a TagCompound key
	 */
	TagString: function (value, isKey) {
		this.value = value
		this.isKey = !!isKey
		this.needQuotes = nbtlint.quotedCharRE.test(value)

		if (!this.needQuotes && !isKey) {
			try {
				if (nbtlint._Parser.parseNumber(value)) {
					this.needQuotes = true
				}
			} catch {
				// Ignore
			}
		}
	},
	/**
	 * A generic NBT number tag
	 * @constructor
	 * @abstract
	 * @param {number} value - The tag's value
	 */
	TagNumberBase: function (value) {
		if (value > this.maxValue)
			throw {
				error: 'value_too_high',
				type: this.constructor,
				max: this.maxValue,
			}
		if (value < this.minValue)
			throw {
				error: 'value_too_low',
				type: this.constructor,
				min: this.minValue,
			}
		this.value = value
	},
	/**
	 * An NBT Byte tag
	 * @constructor
	 * @param {number} value - The tag's value. Must be a whole number (not enforced).
	 * @param {boolean} [preferBool=false] - Whether the byte prefers to be stringified as a boolean.
	 */
	TagByte: function (value, preferBool) {
		nbtlint.TagNumberBase.call(this, value)
		this.preferBool = !!preferBool
	},
	/**
	 * An NBT Short tag
	 * @constructor
	 * @param {number} value - The tag's value. Must be a whole number (not enforced).
	 */
	TagShort: function (value) {
		nbtlint.TagNumberBase.call(this, value)
	},
	/**
	 * An NBT Integer tag
	 * @constructor
	 * @param {number} value - The tag's value. Must be a whole number (not enforced).
	 */
	TagInteger: function (value) {
		nbtlint.TagNumberBase.call(this, value)
	},
	/**
	 * An NBT Long tag
	 * @constructor
	 * @param {string} value - The tag's value. NOT A NUMBER! Must be a string matching /^[-+]?(0|[1-9][0-9]*)$/
	 */
	TagLong: function (value) {
		var sign = value[0]
		if (sign === '+' || sign === '-') {
			value = value.substr(1)
		}

		if (value === '0') return (this.value = 0)
		if (!/^[1-9][0-9]*$/.test(value))
			throw {
				error: 'invalid_format',
				message: 'Badly formatted TagLong string',
			}
		if (value.length > 19) {
			if (sign === '-')
				throw {
					error: 'value_too_low',
					type: nbtlint.TagLong,
					min: this.minValue,
				}
			throw {
				error: 'value_too_high',
				type: nbtlint.TagLong,
				max: this.maxValue,
			}
		}
		if (value.length < 19) {
			if (sign === '-') return (this.value = sign + value)
			return (this.value = value)
		}

		var limit = sign === '-' ? this.minValueSignless : this.maxValue
		for (var i = 0; i < limit.length; ++i) {
			if (value[i] !== limit[i]) {
				if (value[i] < limit[i]) break
				if (sign === '-')
					throw {
						error: 'value_too_low',
						type: nbtlint.TagLong,
						min: this.minValue,
					}
				throw {
					error: 'value_too_high',
					type: nbtlint.TagLong,
					max: this.maxValue,
				}
			}
		}

		if (sign === '-') return (this.value = sign + value)
		return (this.value = value)
	},
	/**
	 * An NBT Float tag
	 * @constructor
	 * @param {number} value - The tag's value.
	 */
	TagFloat: function (value) {
		value = value
		if (value > this.maxValue) value = '9e99'
		if (value < this.minValue) value = '-9e99'
		this.value = value
	},
	/**
	 * An NBT Double tag
	 * @constructor
	 * @param {number} value - The tag's value.
	 */
	TagDouble: function (value) {
		value = value
		if (value > this.maxValue) value = '9e999'
		if (value < this.minValue) value = '-9e999'
		this.value = value
	},
	/**
	 * An NBT Compound tag
	 * @constructor
	 * @param {Object} [values] - A dictionary of Tags to insert into the compound.
	 */
	TagCompound: function (values) {
		this.pairs = []
		this.map = {}
		if (values)
			for (var k in values) {
				this.add(k, values[k])
			}
	},
	/**
	 * An NBT List tag
	 * @constructor
	 * @param {Function} [type=undefined] - The type of the list. Leave undefined to auto-detect, or specify a TagBase constructor.
	 * @param {TagBase[]} [values] - An array of Tags to insert into the list.
	 */
	TagList: function (type, values) {
		this.type = type ? type : undefined
		this.list = []
		if (values)
			for (var i = 0; i < values.length; ++i) {
				this.push(values[i])
			}
	},
	/**
	 * An NBT Byte Array tag
	 * @constructor
	 * @param {TagByte[]} [values] - An array of TagBytes to insert into the array.
	 */
	TagArrayByte: function (values) {
		nbtlint.TagList.call(this, nbtlint.TagByte, values)
	},
	/**
	 * An NBT Int Array tag
	 * @constructor
	 * @param {TagInteger[]} [values] - An array of TagIntegers to insert into the array.
	 */
	TagArrayInt: function (values) {
		nbtlint.TagList.call(this, nbtlint.TagInteger, values)
	},
	/**
	 * An NBT Long Array tag
	 * @constructor
	 * @param {TagLong[]} [values] - An array of TagLongs to insert into the array.
	 */
	TagArrayLong: function (values) {
		nbtlint.TagList.call(this, nbtlint.TagLong, values)
	},
	/**
	 * Convert a TagBase to a textual representation
	 * @param {TagBase} value - The Tag to stringify.
	 * @param {string} [space="\t"] - The string to use for indentation.
	 *
	 * @param {Object}   [options] - Extra options.
	 * @param {boolean}  [options.nlBrackets=false]           - Place brackets on a new line.
	 * @param {boolean}  [options.collapseBrackets=false]     - Collapse adjacent brackets to the same line.
	 * @param {boolean}  [options.expandPrimitives=false]     - Put each item in a list of primitives on its own line, like other lists.
	 * @param {boolean}  [options.trailingComma=false]        - Add a trailing comma immediately before newlines, when valid.
	 * @param {Function} [options.sort=undefined]             - A sorting function to use on compound key-value pairs.
	 *                                                          Recommended: nbtlint.compareAlpha, nbtlint.compareType, nbtlint.compareTypeAlpha.
	 * @param {boolean}  [options.quoteKeys=false]            - Force all keys to be quoted.
	 * @param {boolean}  [options.unquoteStrings=false]       - Avoid quoting non-key strings when possible.
	 * @param {"onlyDouble"|"preferDouble"|"preferSingle"|"onlySingle"}
	 *                   [options.quoteChoice="preferDouble"] - How to choose between single and double quotes.
	 * @param {"always"|"never"|"preference"}
	 *                   [options.boolChoice="preference"]    - How to choose between boolean and numeric bytes.
	 * @param {boolean}  [options.deflate=false]              - Remove all unnecessary whitespace in the result.
	 * @param {Object}   [options.capitalizeSuffix]           - Which number suffixes to capitalize (keys: 'l', 'b', '', etc.).
	 * @param {TagBase}  [options.capitalizeSuffix.default=false] - Whether to capitalize unmentioned suffixes.
	 *
	 * @returns {string}
	 */
	stringify: function (value, space, options) {
		if (space == null) space = '\t'
		options = options || {}
		options.capitalizeSuffix = options.capitalizeSuffix || {}
		return nbtlint._printValue(value, space, '', false, options)
	},
	/**
	 * Parse the textual representation of an NBT Tag.
	 * @param {string} value - The string to parse.
	 * @returns {TagBase} - The parsed Tag.
	 */
	parse: function (value) {
		return nbtlint._Parser.parse(value)
	},
	/**
	 * Compare two key-value compound member pairs alphabetically.
	 * @param {Array} a - The first key-value pair.
	 * @param {Array} b - The second key-value pair.
	 * @returns {number} - The result of the comparison.
	 */
	compareAlpha: function (a, b) {
		var nameA = a[0].value,
			nameAI = nameA.toLowerCase(),
			nameB = b[0].value,
			nameBI = nameB.toLowerCase()
		if (nameAI < nameBI) return -1
		if (nameAI > nameBI) return 1
		if (nameA < nameB) return -1
		if (nameA > nameB) return 1
		return 0
	},
	/**
	 * Compare two key-value compound member pairs by the sortOrders of their types.
	 * @param {Array} a - The first key-value pair.
	 * @param {Array} b - The second key-value pair.
	 * @returns {number} - The result of the comparison.
	 */
	compareType: function (a, b) {
		var orderA = a[1].sortOrder,
			orderB = b[1].sortOrder
		if (orderA < orderB) return -1
		if (orderA > orderB) return 1
		if (a[1].constructor !== nbtlint.TagList) return 0
		orderA = a[1].type ? a[1].type.prototype.sortOrder : 12
		orderB = b[1].type ? b[1].type.prototype.sortOrder : 12
		if (orderA < orderB) return -1
		if (orderA > orderB) return 1
		return 0
	},
	/**
	 * Compare two key-value compound member pairs, first by the sortOrders of their types, then alphabetically.
	 * @param {Array} a - The first key-value pair.
	 * @param {Array} b - The second key-value pair.
	 * @returns {number} - The result of the comparison.
	 */
	compareTypeAlpha: function (a, b) {
		return nbtlint.compareType(a, b) || nbtlint.compareAlpha(a, b)
	},
	/**
	 * Sort a list while ensuring that items which compare equal stay in the same order relative to each other.
	 * @param {Array} list - The list to sort.
	 * @param {Function} cmp - The comparison function.
	 * @returns {Array} - The new sorted list.
	 */
	stableSorted: function (list, cmp) {
		cmp =
			cmp ||
			function (a, b) {
				if (a < b) return -1
				if (a > b) return 1
				return 0
			}
		var indexed = list.map(function (e, i) {
			return [e, i]
		})
		indexed.sort(function (a, b) {
			return cmp(a[0], b[0]) || a[1] - b[1]
		})
		return indexed.map(function (e) {
			return e[0]
		})
	},
	_printValue: function (value, space, indent, hasName, options) {
		var str
		switch (value.constructor) {
			case nbtlint.TagString:
				str = nbtlint._printString(value, options)
				break
			case nbtlint.TagByte:
				if (
					(value.value === 0 || value.value === 1) &&
					options.boolChoice !== 'never' &&
					(options.boolChoice === 'always' || value.preferBool)
				) {
					str = value.value ? 'true' : 'false'
					break
				}
			// fall through
			case nbtlint.TagShort:
			case nbtlint.TagInteger:
			case nbtlint.TagLong:
			case nbtlint.TagFloat:
			case nbtlint.TagDouble:
				str = nbtlint._printNumber(value, options)
				break
			case nbtlint.TagCompound:
				return nbtlint._printCompound(
					value,
					space,
					indent,
					hasName,
					options
				)
			case nbtlint.TagList:
			case nbtlint.TagArrayByte:
			case nbtlint.TagArrayInt:
			case nbtlint.TagArrayLong:
				return nbtlint._printList(
					value,
					space,
					indent,
					hasName,
					options
				)
		}
		if (hasName && !options.deflate) str = ' ' + str
		return str
	},
	_printString: function (str, options) {
		if (
			str.needQuotes ||
			(str.isKey ? options.quoteKeys : !options.unquoteStrings)
		) {
			var quote

			if (options.quoteChoice === 'onlyDouble') {
				quote = '"'
			} else if (options.quoteChoice === 'onlySingle') {
				quote = "'"
			} else {
				var compare =
					str.value.split('"').length - str.value.split("'").length
				// More " -> positive, more ' -> negative, equal -> 0.
				if (compare < 0) {
					quote = '"'
				} else if (compare > 0) {
					quote = "'"
				} else {
					quote = options.quoteChoice === 'preferSingle' ? "'" : '"'
				}
			}

			return (
				quote +
				str.value
					.replace(/\\/g, '\\\\')
					.replace(quote === '"' ? /"/g : /'/g, '\\$&') +
				quote
			)
		}
		return str.value
	},
	_printNumber: function (number, options) {
		var cap = options.capitalizeSuffix[number.suffix]
		if (cap == null) cap = options.capitalizeSuffix['default']
		return (
			number.value + (cap ? number.suffix.toUpperCase() : number.suffix)
		)
	},
	_printCompound: function (value, space, indent, hasName, options) {
		if (value.pairs.length === 0) {
			return options.deflate || !hasName ? '{}' : ' {}'
		}
		var oldIndent = indent,
			indent = oldIndent + space,
			list = value.pairs,
			l = list.length,
			i,
			str
		if (options.deflate) {
			str = '{'
		} else if (hasName) {
			if (options.nlBrackets) {
				str = '\n' + oldIndent + '{\n'
			} else {
				str = ' {\n'
			}
		} else {
			str = '{\n'
		}
		if (options.sort) {
			list = nbtlint.stableSorted(list, options.sort)
		}
		for (i = 0; i < l; ++i) {
			if (!options.deflate) str += indent
			str += nbtlint._printString(list[i][0], options) + ':'
			str += nbtlint._printValue(list[i][1], space, indent, true, options)
			if (i !== l - 1) {
				str += options.deflate ? ',' : ',\n'
			} else if (!options.deflate) {
				if (options.trailingComma) str += ','
				str += '\n' + oldIndent
			}
		}
		return str + '}'
	},
	_printList: function (value, space, indent, hasName, options) {
		if (value.list.length === 0)
			return (options.deflate ? '[' : ' [') + value.arrayPrefix + ']'
		var isPrimitive = value.list[0].isPrimitive,
			l = value.list.length,
			i,
			str
		if (!options.expandPrimitives && isPrimitive) {
			// One line
			str = (options.deflate ? '[' : ' [') + value.arrayPrefix
			if (value.arrayPrefix && !options.deflate) str += ' '
			for (i = 0; i < l; ++i) {
				str += nbtlint._printValue(
					value.list[i],
					'',
					'',
					false,
					options
				)
				if (i !== l - 1) str += options.deflate ? ',' : ', '
			}
			return str + ']'
		}
		// Multi-line
		var collapseBr = !isPrimitive && options.collapseBrackets,
			oldIndent = indent,
			indent = collapseBr ? oldIndent : oldIndent + space,
			open = '[' + value.arrayPrefix
		if (options.deflate) {
			str = open
		} else {
			if (hasName) {
				if (options.nlBrackets) {
					str = '\n' + oldIndent + open
				} else {
					str = ' ' + open
				}
			} else {
				str = open
			}
			if (!collapseBr) str += '\n'
		}
		for (i = 0; i < l; ++i) {
			if (!(options.deflate || (i === 0 && collapseBr))) str += indent
			str += nbtlint._printValue(
				value.list[i],
				space,
				indent,
				false,
				options
			)
			if (i !== l - 1) {
				str += options.deflate ? ',' : ',\n'
			} else if (!(collapseBr || options.deflate)) {
				if (options.trailingComma) str += ','
				str += '\n' + oldIndent
			}
		}
		return str + ']'
	},
	_Parser: {
		/**
		 * Parse the textual representation of an NBT Tag.
		 * @param {string} value - The string to parse.
		 * @returns {TagBase} - The parsed Tag.
		 */
		parse: function (value) {
			this.string = value
			this.cursor = 0

			var compound = this.readCompound()
			this.skipWhitespace()

			if (this.canRead()) {
				++this.cursor
				throw this.exception('Trailing data found')
			}

			return compound
		},
		canRead: function () {
			return this.cursor < this.string.length
		},
		whitespaceRE: /^\s*/,
		skipWhitespace: function () {
			this.cursor += this.string
				.substr(this.cursor)
				.match(this.whitespaceRE)[0].length
		},
		hasElementSeparator: function () {
			this.skipWhitespace()
			if (this.canRead() && this.peek() === ',') {
				++this.cursor
				this.skipWhitespace()
				return true
			}
			return false
		},
		expect: function (expected) {
			this.skipWhitespace()
			var canRead = this.canRead()

			if (canRead && this.peek() === expected) {
				++this.cursor
			} else {
				var message =
					"Expected '" +
					expected +
					"' but got '" +
					(canRead ? this.peek() : '<EOF>') +
					"'"
				++this.cursor
				throw this.exception(message)
			}
		},
		peek: function (offset) {
			return this.string[this.cursor + (offset | 0)]
		},
		pop: function () {
			return this.string[this.cursor++]
		},
		exception: function (message, suggestion) {
			var end = Math.min(this.string.length, this.cursor),
				exception
			if (end > 35) {
				exception = '...'
			} else {
				exception = ''
			}
			exception += this.string
				.substring(Math.max(0, end - 35), end)
				.replace(/\n/g, '\u21B5')
			exception += '<--[HERE]'
			exception = message + ' at: ' + exception
			if (suggestion)
				return {
					error: 'parsing_error',
					message: exception,
					suggestion: suggestion,
				}
			return { error: 'parsing_error', message: exception }
		},
		readCompound: function () {
			this.expect('{')
			var compound = new nbtlint.TagCompound()
			this.skipWhitespace()

			while (this.canRead() && this.peek() != '}') {
				this.skipWhitespace()
				var key
				if (!this.canRead()) {
					throw this.exception('Expected a key')
				} else {
					var quote = this.peek()
					if (quote === '"' || quote === "'") {
						key = this.readQuotedString()
					} else {
						key = this.readUnquotedString()
					}
				}
				if (!key) throw this.exception('Expected non-empty key')
				if (key in compound.map) throw this.exception('Duplicate key')

				this.expect(':')
				compound.add(key, this.readValue())

				if (!this.hasElementSeparator()) break
				if (!this.canRead()) throw this.exception('Expected a key')
			}
			this.expect('}')
			return compound
		},
		readValue: function () {
			this.skipWhitespace()
			if (!this.canRead()) throw this.exception('Expected a value')
			var next = this.peek()

			switch (next) {
				case '{':
					return this.readCompound()
				case '[':
					return this.peek(1) !== '"' && this.peek(2) === ';'
						? this.readArrayTag()
						: this.readListTag()
				case '"':
				case "'":
					return new nbtlint.TagString(this.readQuotedString(), false)
			}
			var s = this.readUnquotedString(),
				num
			if (!s) throw this.exception('Expected a value')
			try {
				num = this.parseNumber(s)
			} catch (e) {
				s = new nbtlint.TagString(s, false)
				s.limitErr = e
				return s
			}
			return num || new nbtlint.TagString(s, false)
		},
		readArrayTag: function () {
			this.expect('[')
			var type = this.pop(),
				array
			this.pop()
			this.skipWhitespace()

			if (!this.canRead()) throw this.exception('Expected a value')
			switch (type) {
				case 'B':
					array = new nbtlint.TagArrayByte()
					break
				case 'L':
					array = new nbtlint.TagArrayLong()
					break
				case 'I':
					array = new nbtlint.TagArrayInt()
					break
				default:
					throw this.exception(
						"Invalid array type '" + type + "' found"
					)
			}

			while (true) {
				if (this.peek() === ']') {
					++this.cursor
					return array
				}

				var currValue = this.readValue()
				if (currValue.constructor !== array.type) {
					throw this.exception(
						'Unable to insert ' +
							currValue.tagName +
							' into ' +
							array.tagName
					)
				}
				array.push(currValue)
				if (this.hasElementSeparator()) {
					if (!this.canRead())
						throw this.exception('Expected a value')
					continue
				}

				this.expect(']')
				return array
			}
		},
		readListTag: function () {
			this.expect('[')
			this.skipWhitespace()

			if (!this.canRead()) {
				throw this.exception('Expected a value')
			} else {
				var list = new nbtlint.TagList()

				while (this.peek() !== ']') {
					var val = this.readValue()
					try {
						list.push(val)
					} catch (e) {
						throw this.exception(
							'Unable to insert ' +
								val.tagName +
								' into ListTag of type ' +
								list.type.prototype.tagName
						)
					}
					if (!this.hasElementSeparator()) break
					if (!this.canRead())
						throw this.exception('Expected a value')
				}

				this.expect(']')
				return list
			}
		},
		unquotedCharsRE: /^[a-zA-Z0-9._+\-]*/,
		readUnquotedString: function () {
			var string = this.string
				.substr(this.cursor)
				.match(this.unquotedCharsRE)[0]
			this.cursor += string.length
			return string
		},
		readQuotedString: function () {
			var quote = this.pop(),
				startChunkIndex = this.cursor,
				string = '',
				inEscape = false
			while (this.canRead()) {
				var c = this.pop()
				if (inEscape) {
					if (c !== '\\' && c !== quote)
						throw this.exception('Invalid escape of ' + c)
					string += c
					startChunkIndex = this.cursor
					inEscape = false
				} else if (c === '\\') {
					inEscape = true
					string += this.string.substring(
						startChunkIndex,
						this.cursor - 1
					)
				} else if (c == quote) {
					return (
						string +
						this.string.substring(startChunkIndex, this.cursor - 1)
					)
				}
			}
			throw this.exception('Missing termination quote')
		},
		doubleNoSufRE: /^[-+]?(?:[0-9]+\.|[0-9]*\.[0-9]+)(?:e[-+]?[0-9]+)?$/i,
		doubleRE: /^[-+]?(?:[0-9]+\.?|[0-9]*\.[0-9]+)(?:e[-+]?[0-9]+)?d$/i,
		floatRE: /^[-+]?(?:[0-9]+\.?|[0-9]*\.[0-9]+)(?:e[-+]?[0-9]+)?f$/i,
		byteRE: /^[-+]?(?:0|[1-9][0-9]*)b$/i,
		shortRE: /^[-+]?(?:0|[1-9][0-9]*)s$/i,
		integerRE: /^[-+]?(?:0|[1-9][0-9]*)$/,
		longRE: /^([-+])?(?:0|[1-9][0-9]*)l$/i,
		parseNumber: function (s) {
			if (this.floatRE.test(s)) {
				return new nbtlint.TagFloat(+s.substr(0, s.length - 1))
			}
			if (this.byteRE.test(s)) {
				return new nbtlint.TagByte(+s.substring(0, s.length - 1), false)
			}
			if (this.longRE.test(s)) {
				// As a string
				return new nbtlint.TagLong(s.substring(0, s.length - 1))
			}
			if (this.shortRE.test(s)) {
				return new nbtlint.TagShort(+s.substring(0, s.length - 1))
			}
			if (this.integerRE.test(s)) {
				return new nbtlint.TagInteger(+s)
			}
			if (this.doubleRE.test(s)) {
				return new nbtlint.TagDouble(+s.substring(0, s.length - 1))
			}
			if (this.doubleNoSufRE.test(s)) {
				return new nbtlint.TagDouble(+s)
			}
			if (s.toLowerCase() === 'true') {
				return new nbtlint.TagByte(1, true)
			}
			if (s.toLowerCase() === 'false') {
				return new nbtlint.TagByte(0, true)
			}
		},
	},
}

function extend(parent, children) {
	for (var i = children.length - 1; i >= 0; --i) {
		children[i].prototype = Object.create(parent.prototype)
		children[i].prototype.constructor = children[i]
	}
}
extend(nbtlint.TagBase, [
	nbtlint.TagString,
	nbtlint.TagCompound,
	nbtlint.TagList,
	nbtlint.TagNumberBase,
])
extend(nbtlint.TagList, [
	nbtlint.TagArrayByte,
	nbtlint.TagArrayInt,
	nbtlint.TagArrayLong,
])
extend(nbtlint.TagNumberBase, [
	nbtlint.TagByte,
	nbtlint.TagShort,
	nbtlint.TagInteger,
	nbtlint.TagLong,
	nbtlint.TagFloat,
	nbtlint.TagDouble,
])

nbtlint.byID = {
	1: nbtlint.TagByte,
	2: nbtlint.TagShort,
	3: nbtlint.TagInteger,
	4: nbtlint.TagLong,
	5: nbtlint.TagFloat,
	6: nbtlint.TagDouble,
	7: nbtlint.TagArrayByte,
	8: nbtlint.TagString,
	9: nbtlint.TagList,
	10: nbtlint.TagCompound,
	11: nbtlint.TagArrayInt,
	12: nbtlint.TagArrayLong,
}
for (var id in nbtlint.byID) {
	nbtlint.byID[id].prototype.tagID = id | 0
}
nbtlint.TagByte.prototype.tagName = 'TAG_Byte'
nbtlint.TagShort.prototype.tagName = 'TAG_Short'
nbtlint.TagInteger.prototype.tagName = 'TAG_Int'
nbtlint.TagLong.prototype.tagName = 'TAG_Long'
nbtlint.TagFloat.prototype.tagName = 'TAG_Float'
nbtlint.TagDouble.prototype.tagName = 'TAG_Double'
nbtlint.TagString.prototype.tagName = 'TAG_String'
nbtlint.TagList.prototype.tagName = 'TAG_List'
nbtlint.TagCompound.prototype.tagName = 'TAG_Compound'
nbtlint.TagArrayByte.prototype.tagName = 'TAG_Byte_Array'
nbtlint.TagArrayInt.prototype.tagName = 'TAG_Int_Array'
nbtlint.TagArrayLong.prototype.tagName = 'TAG_Long_Array'

nbtlint.TagByte.prototype.suffix = 'b'
nbtlint.TagShort.prototype.suffix = 's'
nbtlint.TagInteger.prototype.suffix = ''
nbtlint.TagLong.prototype.suffix = 'l'
nbtlint.TagFloat.prototype.suffix = 'f'
nbtlint.TagDouble.prototype.suffix = 'd'
nbtlint.TagList.prototype.arrayPrefix = ''
nbtlint.TagArrayByte.prototype.arrayPrefix = 'B;'
nbtlint.TagArrayInt.prototype.arrayPrefix = 'I;'
nbtlint.TagArrayLong.prototype.arrayPrefix = 'L;'

nbtlint.TagByte.prototype.minValue = -128
nbtlint.TagByte.prototype.maxValue = 127
nbtlint.TagShort.prototype.minValue = -32768
nbtlint.TagShort.prototype.maxValue = 32767
nbtlint.TagInteger.prototype.minValue = -2147483648
nbtlint.TagInteger.prototype.maxValue = 2147483647
nbtlint.TagLong.prototype.minValue = '-9223372036854775808'
nbtlint.TagLong.prototype.maxValue = '9223372036854775807'
nbtlint.TagLong.prototype.minValueSignless = '9223372036854775808'
nbtlint.TagDouble.prototype.minValue = -Number.MAX_VALUE
nbtlint.TagDouble.prototype.maxValue = Number.MAX_VALUE
// Calculate max float32 value as accurately as possible
if (
	typeof ArrayBuffer !== 'undefined' &&
	typeof Float32Array !== 'undefined' &&
	typeof Int32Array !== 'undefined'
) {
	var buf = new ArrayBuffer(4),
		f32 = new Float32Array(buf),
		i32 = new Int32Array(buf)
	i32[0] = 0x7f7fffff
	nbtlint.TagFloat.prototype.minValue = -f32[0]
	nbtlint.TagFloat.prototype.maxValue = f32[0]
} else {
	nbtlint.TagFloat.prototype.minValue = -3.4028234663852886e38
	nbtlint.TagFloat.prototype.maxValue = 3.4028234663852886e38
}

nbtlint.TagString.prototype.sortOrder = 0
nbtlint.TagByte.prototype.sortOrder = 1
nbtlint.TagShort.prototype.sortOrder = 2
nbtlint.TagInteger.prototype.sortOrder = 3
nbtlint.TagLong.prototype.sortOrder = 4
nbtlint.TagFloat.prototype.sortOrder = 5
nbtlint.TagDouble.prototype.sortOrder = 6
nbtlint.TagCompound.prototype.sortOrder = 7
nbtlint.TagArrayByte.prototype.sortOrder = 8
nbtlint.TagArrayInt.prototype.sortOrder = 9
nbtlint.TagArrayLong.prototype.sortOrder = 10
nbtlint.TagList.prototype.sortOrder = 11

nbtlint.TagString.prototype.isPrimitive = true
nbtlint.TagNumberBase.prototype.isPrimitive = true
nbtlint.TagCompound.prototype.isPrimitive = false
nbtlint.TagList.prototype.isPrimitive = false

/**
 * Add a Tag to a Compound.
 * @param {string} key - The key of the new Tag.
 * @param {TagBase} value - The Tag to add.
 */
nbtlint.TagCompound.prototype.add = function (key, value) {
	if (key in this.map) {
		throw {
			error: 'duplicate_key',
			message:
				'Duplicate key: ' +
				nbtlint._printString(new nbtlint.TagString(key, true), {}),
		}
	}
	this.pairs.push([new nbtlint.TagString(key, true), value])
	this.map[key] = value
}
/**
 * Remove a Tag from a Compound.
 * @param {string} key - The key of the Tag to remove.
 * @returns {TagBase} - The Tag removed, or null if not found.
 */
nbtlint.TagCompound.prototype.remove = function (key) {
	if (key in this.map) {
		delete this.map[key]
	} else {
		return null
	}
	for (var i = this.pairs.length - 1; i >= 0; --i) {
		if (this.pairs[i][0].value === key) {
			return this.pairs.splice(i, 1)[0][1]
		}
	}
	throw {
		error: 'inconsistent_state',
		message:
			'The internal state of this compound is borked. Did you mess with it?',
	}
}
/**
 * Add a Tag to the end of a List.
 * @param {TagBase} value - The Tag to add.
 */
nbtlint.TagList.prototype.push = function (value) {
	this.type = this.type || value.constructor
	if (value.constructor !== this.type) {
		// TODO: Explain how type is determined, suggest fix
		throw {
			error: 'invalid_tag_type',
			message:
				'Cannot insert ' +
				value.constructor.name +
				' into a list of type ' +
				this.type.name,
		}
	}
	this.list.push(value)
}

/////////////////
// Export code //
/////////////////
export default nbtlint
// export default nbtlint
