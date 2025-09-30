import { UnicodeString } from '../../util/unicodeString'
import { Component, ComponentStyle, CompositeComponent, JsonText } from '../jsonText'
import { getVanillaFont } from './fontManager'

// Jumpstarted by @IanSSenne (FetchBot) and refactored by @SnaveSutit to do line wrapping on JSON Text Components.
// THANK U IAN <3 - SnaveSutit

function getText(component: string | CompositeComponent): UnicodeString {
	if (typeof component === 'string') {
		return new UnicodeString(component)
	}

	switch (true) {
		case component.text !== undefined:
			return new UnicodeString(component.text)

		case component.translate !== undefined:
			return new UnicodeString(`{${component.translate}}`)

		case component.selector !== undefined:
			return new UnicodeString(`{${component.selector}}`)

		case component.score !== undefined:
			return new UnicodeString(`{${component.score.name}:${component.score.objective}}`)

		case component.keybind !== undefined:
			return new UnicodeString(`{${component.keybind}}`)

		case component.nbt !== undefined:
			switch (true) {
				case component.block !== undefined:
					return new UnicodeString(`{${component.block}:${component.nbt}}`)

				case component.entity !== undefined:
					return new UnicodeString(`{${component.entity}:${component.nbt}}`)

				case component.storage !== undefined:
					return new UnicodeString(`{${component.storage}:${component.nbt}}`)

				default:
					return new UnicodeString(`{${component.nbt}}`)
			}

		default:
			return new UnicodeString('')
	}
}

export interface IStyleSpan {
	style: ComponentStyle
	start: number
	end: number
}

export interface IComponentWord {
	styles: IStyleSpan[]
	text: UnicodeString
	/**
	 * The width of the word in pixels.
	 */
	width: number
	forceWrap?: boolean
}

interface IComponentLine {
	words: IComponentWord[]
	width: number
}

const defaultStyle: ComponentStyle = { color: 'white' }
/**
 * Gets the words from a JSON Text Component, while keeping track of the styles applied to each word.
 *
 * WARNING: Word width is not calculated by this function.
 */
export function getComponentWords(input: Component) {
	const flattenedComponents = new JsonText(input).flatten()
	if (!flattenedComponents.length) return []
	const words: IComponentWord[] = []

	let word: IComponentWord | undefined
	let component = flattenedComponents.shift()
	if (component === undefined) return words

	let componentText = getText(component)
	let span: IStyleSpan = {
		style: JsonText.getComponentStyle(component, defaultStyle),
		start: 0,
		end: 0,
	}

	console.time('getComponentWords')

	while (component !== undefined) {
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
						word.styles.push({ ...span })
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

			if (!word) {
				word = { styles: [], text: new UnicodeString(''), width: 0 }
			}
			word.text.append(char)
			span.end++
		}

		component = flattenedComponents.shift()

		if (component !== undefined) {
			componentText = getText(component)
			if (word) {
				word.styles.push(span)
				span = {
					style: JsonText.getComponentStyle(component, defaultStyle),
					start: span.end,
					end: span.end,
				}
			} else {
				span = {
					style: JsonText.getComponentStyle(component, defaultStyle),
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

	console.timeEnd('getComponentWords')
	return words
}

export async function computeTextWrapping(words: IComponentWord[], maxLineWidth = 200) {
	console.time('computeTextWrapping')
	const lines: IComponentLine[] = []
	const font = await getVanillaFont()

	let backgroundWidth = 0
	let currentLine: IComponentLine = { words: [], width: 0 }
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
			let style: IStyleSpan | undefined = wordStyles.shift()
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

	console.timeEnd('computeTextWrapping')
	return { lines, backgroundWidth }
}
