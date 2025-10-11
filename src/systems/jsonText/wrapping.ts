import { Stopwatch } from 'src/util/stopwatch'
import { JsonText, type ComponentStyle, type TextElement, type TextObject } from '.'
import { getVanillaFont } from '../minecraft/fontManager'
import { UnicodeString } from './unicodeString'

// Jumpstarted by @IanSSenne (FetchBot) and refactored by @SnaveSutit to do line wrapping on JSON Text Components.
// THANK U IAN <3 - SnaveSutit

function getRawText(element: string | TextObject): UnicodeString {
	if (typeof element === 'string') {
		return new UnicodeString(element)
	}

	switch (true) {
		case element.text !== undefined:
			return new UnicodeString(element.text)

		case element.translate !== undefined:
			return new UnicodeString(`{${element.translate}}`)

		case element.selector !== undefined:
			return new UnicodeString(`{${element.selector}}`)

		case element.score !== undefined:
			return new UnicodeString(`{${element.score.name}:${element.score.objective}}`)

		case element.keybind !== undefined:
			return new UnicodeString(`{${element.keybind}}`)

		case element.nbt !== undefined:
			switch (true) {
				case element.block !== undefined:
					return new UnicodeString(`{${element.block}:${element.nbt}}`)

				case element.entity !== undefined:
					return new UnicodeString(`{${element.entity}:${element.nbt}}`)

				case element.storage !== undefined:
					return new UnicodeString(`{${element.storage}:${element.nbt}}`)

				default:
					return new UnicodeString(`{${element.nbt}}`)
			}

		case element.sprite !== undefined:
			return new UnicodeString(`{sprite:${element.sprite}}`)

		case element.player !== undefined:
			return new UnicodeString(`{player:${element.player}}`)

		default:
			console.warn('Unknown JSON Text element:', element)
			return new UnicodeString('{Unknown Element}')
	}
}

export interface StyleSpan {
	style: ComponentStyle
	start: number
	end: number
}

export interface Word {
	styles: StyleSpan[]
	text: UnicodeString
	/**
	 * The width of the word in pixels.
	 */
	width: number
	forceWrap?: boolean
}

interface Line {
	words: Word[]
	width: number
}

/**
 * Gets the words from a JSON Text Element, keeping track of the styles applied to each word.
 *
 * WARNING: Word width is ***not calculated*** by this function.
 */
export function parseWords(inputElement: TextElement) {
	const stopwatch = new Stopwatch('Parse Words').start()
	const flattened = new JsonText(inputElement).flatten(true)
	if (!flattened.length) return []
	const words: Word[] = []

	let word: Word | undefined
	let element = flattened.shift()
	if (element === undefined) return words

	let componentText = getRawText(element)
	let span: StyleSpan = {
		style: JsonText.getComponentStyle(element),
		start: 0,
		end: 0,
	}

	while (element !== undefined) {
		for (const char of componentText) {
			if (char === ' ') {
				// A group of multiple spaces is treated as a word.
				if (word && !(word.text.at(-1) === ' ')) {
					span.end++
					if (Object.keys(span.style).length) {
						word.styles.push({ ...span })
						span.start = 0
						span.end = 0
					}
					words.push(word)
					word = undefined
				}
			} else if (char === '\n') {
				if (word) {
					if (Object.keys(span.style).length) {
						if (span.start < span.end) {
							word.styles.push({ ...span })
						}
						span.start = 0
						span.end = 0
					}
					words.push(word)
				}
				words.push({
					styles: [],
					text: new UnicodeString(''),
					width: 0,
					forceWrap: true,
				})
				word = undefined
				continue
			} else if (char !== ' ' && word?.text.at(-1) === ' ') {
				span.end++
				if (Object.keys(span.style).length) {
					word.styles.push({ ...span })
					span.start = 0
					span.end = 0
				}
				words.push(word)
				word = undefined
			}

			word ??= { styles: [], text: new UnicodeString(''), width: 0 }
			word.text.append(char)
			span.end++
		}

		element = flattened.shift()

		if (element !== undefined) {
			componentText = getRawText(element)
			if (word) {
				word.styles.push(span)
				span = {
					style: JsonText.getComponentStyle(element),
					start: span.end,
					end: span.end,
				}
			} else {
				span = {
					style: JsonText.getComponentStyle(element),
					start: 0,
					end: 0,
				}
			}
		}
	}

	if (word) {
		if (Object.keys(span.style).length) {
			word.styles.push(span)
		}
		words.push(word)
	}

	stopwatch.debug()
	return words
}

export async function wrapJsonText(jsonText: JsonText, maxLineWidth = 200) {
	const stopwatch = new Stopwatch('Wrap Json Text').start()

	const words = parseWords(jsonText.toJSON())
	const lines: Line[] = []
	// FIXME - This will not work for custom fonts
	const font = await getVanillaFont()

	let backgroundWidth = 0
	let currentLine: Line = { words: [], width: 0 }
	for (const word of words) {
		const wordWidth = font.getWordWidth(word)
		const wordStyles = [...word.styles]
		// If the word is longer than than the max line width, split it into multiple lines
		if (wordWidth - 1 > maxLineWidth) {
			if (currentLine.words.length) {
				lines.push(currentLine)
				backgroundWidth = Math.max(backgroundWidth, currentLine.width)
			}
			currentLine = { words: [], width: 0 }

			let part = new UnicodeString('')
			let partWidth = 0
			let partStartIndex = 0
			let style: StyleSpan | undefined = wordStyles.shift()
			if (!style) throw new Error(`No active style found for word '${word.text.toString()}'`)

			for (let i = 0; i < word.text.length; i++) {
				const char = word.text.at(i)!
				if (wordStyles.length > 1 && i >= style.end) {
					style = wordStyles.shift()!
				}

				const charWidth = font.getTextWidth(new UnicodeString(char), style)
				if (part.length > 0 && partWidth + (charWidth - 1) > maxLineWidth) {
					// Find all styles that apply to this part
					// FIXME: Attempt to avoid filtering and maping the styles for each character
					const partStyles = word.styles
						.filter(
							span =>
								span.start < partStartIndex + part.length &&
								span.end >= partStartIndex
						)
						.map(span => ({
							...span,
							start: Math.max(span.start - partStartIndex, 0),
							end: Math.min(span.end - partStartIndex, part.length),
						}))
					lines.push({
						words: [{ text: part, styles: partStyles, width: wordWidth }],
						width: partWidth,
					})
					backgroundWidth = Math.max(backgroundWidth, partWidth)
					partStartIndex += part.length
					part = new UnicodeString('')
					partWidth = 0
				}
				part.append(char)
				partWidth += charWidth
			}
			if (part) {
				// Find all styles that apply to this part
				// FIXME: Attempt to avoid filtering and maping the styles for each character
				const partStyles = word.styles
					.filter(
						span =>
							span.start < partStartIndex + part.length && span.end >= partStartIndex
					)
					.map(span => ({
						...span,
						start: Math.max(span.start - partStartIndex, 0),
						end: Math.min(span.end - partStartIndex, part.length),
					}))
				backgroundWidth = Math.max(backgroundWidth, partWidth)
				currentLine = {
					words: [{ text: part, styles: partStyles, width: wordWidth }],
					width: partWidth,
				}
			}
			continue
			// If the word is a newline character, force a line break
		} else if (word.forceWrap) {
			if (currentLine.words.length) {
				lines.push(currentLine)
				backgroundWidth = Math.max(backgroundWidth, currentLine.width)
			}
			currentLine = { words: [], width: 0 }
			// If the current line has words and adding the current word would exceed the max line width, start a new line
		} else if (currentLine.words.length && currentLine.width + (wordWidth - 1) > maxLineWidth) {
			const lastWord = currentLine.words.at(-1)
			// This will only effect space "words"
			if (lastWord?.text.at(-1) === ' ') {
				currentLine.words.pop()
				currentLine.width -= lastWord.width
			}
			lines.push(currentLine)
			backgroundWidth = Math.max(backgroundWidth, currentLine.width)
			currentLine = { words: [], width: 0 }
		}
		word.width = wordWidth
		currentLine.words.push(word)
		currentLine.width += wordWidth
	}
	if (currentLine.words.length) {
		lines.push(currentLine)
		backgroundWidth = Math.max(backgroundWidth, currentLine.width)
	}

	stopwatch.debug()
	return { lines, backgroundWidth }
}
