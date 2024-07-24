import { UnicodeString } from '../../util/unicodeString'
import { getVanillaFont } from './fontManager'
import { JsonText, JsonTextArray, JsonTextComponent, JsonTextObject } from './jsonText'

// @ts-ignore
// import TestWorker from './textWrapping.worker.ts'
// const WORKER: Worker = new TestWorker()
// WORKER.onmessage = ({ data }) => {
// 	console.log(data)
// }

// Jumpstarted by @IanSSenne (FetchBot) and refactored by @SnaveSutit to do line wrapping on JSON Text Components.
// THANK U IAN <3 - SnaveSutit
const STYLE_KEYS = [
	'bold',
	'italic',
	'underlined',
	'strikethrough',
	'obfuscated',
	'color',
	'font',
] as const

export type StyleRecord = Partial<Record<(typeof STYLE_KEYS)[number], boolean | string>>
function getStylesFromComponent(
	component: JsonTextObject,
	parent: StyleRecord = { color: 'white' }
): StyleRecord {
	for (const key of STYLE_KEYS) {
		if (component[key]) {
			parent[key] = component[key]
		}
	}
	return parent
}

function getFirstItemStyle(input: JsonTextArray): StyleRecord {
	let item = input.at(0)
	if (Array.isArray(item)) {
		return getFirstItemStyle(item)
	} else if (item instanceof JsonText) {
		item = item.toJSON() as JsonTextObject | JsonTextArray
		if (Array.isArray(item)) return getFirstItemStyle(item)
		else return getStylesFromComponent(item)
	} else if (typeof item === 'object') {
		return getStylesFromComponent(item)
	}
	return {}
}

function flattenTextComponent(input: JsonTextComponent): JsonTextObject[] {
	const output: JsonTextObject[] = []
	function flattenComponent(component: JsonTextComponent, parentStyle: StyleRecord = {}) {
		if (Array.isArray(component)) {
			// The items of an array inherit the first item's style
			parentStyle = Object.assign({}, parentStyle, getFirstItemStyle(component))
			for (const subcomponent of component) {
				flattenComponent(subcomponent, parentStyle)
			}
		} else if (typeof component === 'string') {
			output.push(
				Object.assign({}, parentStyle, {
					text: component,
				}) as JsonTextObject
			)
		} else if (component instanceof JsonText) {
			flattenComponent(component.toJSON(), parentStyle)
		} else if (typeof component === 'object') {
			output.push(Object.assign({}, parentStyle, component, { extra: undefined }))
			if (component.extra) {
				const childStyles = getStylesFromComponent(component)
				flattenComponent(component.extra, childStyles)
			}
		}
	}
	flattenComponent(input)
	return output
}

function getText(component: JsonTextObject) {
	if (typeof component === 'string') return new UnicodeString(component)
	else if (component.text) return new UnicodeString(component.text)
	else if (component.translate) return new UnicodeString(`{${component.translate}}`)
	else if (component.selector) return new UnicodeString(`{${component.selector}}`)
	else if (component.score) {
		if (component.score.value) return new UnicodeString(`{${component.score.value}}`)
		return new UnicodeString(`{${component.score.name}:${component.score.objective}}`)
	} else if (component.keybind) return new UnicodeString(`{${component.keybind}}`)
	else if (component.nbt) {
		if (component.block) return new UnicodeString(`{${component.block}:${component.nbt}}`)
		else if (component.entity)
			return new UnicodeString(`{${component.entity}:${component.nbt}}`)
		else if (component.storage)
			return new UnicodeString(`{${component.storage}:${component.nbt}}`)
		return new UnicodeString(`{${component.nbt}}`)
	}
	return new UnicodeString('')
}

export interface IStyleSpan {
	style: StyleRecord
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
/**
 * Gets the words from a JSON Text Component, while keeping track of the styles applied to each word.
 *
 * WARNING: Word width is not calculated by this function.
 */
export function getComponentWords(input: JsonTextComponent) {
	console.time('getComponentWords')
	const flattenedComponents = flattenTextComponent(input)
	if (!flattenedComponents.length) return []
	const words: IComponentWord[] = []
	let word: IComponentWord | undefined
	let component: JsonTextObject | undefined = flattenedComponents.shift()
	let componentText = getText(component!)
	let style: IStyleSpan = {
		style: getStylesFromComponent(component!),
		start: 0,
		end: 0,
	}

	while (component) {
		for (const char of componentText) {
			if (char === ' ') {
				// A group of multiple spaces is treated as a word.
				if (word && !(word.text.at(-1) === ' ')) {
					style.end++
					if (Object.keys(style.style).length) {
						word.styles.push({ ...style })
						style.start = 0
						style.end = 0
					}
					words.push(word)
					word = undefined
				}
			} else if (char === '\n') {
				if (word) {
					if (Object.keys(style.style).length) {
						word.styles.push({ ...style })
						style.start = 0
						style.end = 0
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
				style.end++
				if (Object.keys(style.style).length) {
					word.styles.push({ ...style })
					style.start = 0
					style.end = 0
				}
				words.push(word)
				word = undefined
			}

			if (!word) {
				word = { styles: [], text: new UnicodeString(''), width: 0 }
			}
			word.text.append(char)
			style.end++
		}
		component = flattenedComponents.shift()
		if (component) {
			componentText = getText(component)
			if (word) {
				word.styles.push(style)
				style = {
					style: getStylesFromComponent(component),
					start: style.end,
					end: style.end,
				}
			} else {
				style = { style: getStylesFromComponent(component), start: 0, end: 0 }
			}
		}
	}

	if (word) {
		if (Object.keys(style.style).length) {
			word.styles.push(style)
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
