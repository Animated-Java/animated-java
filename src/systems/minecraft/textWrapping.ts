import { JsonText, JsonTextComponent, JsonTextObject } from './jsonText'
import { getVanillaFont } from './fontManager'

// @ts-ignore
// import TestWorker from './textWrapping.worker.ts'
// const WORKER: Worker = new TestWorker()
// WORKER.onmessage = ({ data }) => {
// 	console.log(data)
// }

// Written by @IanSSenne (FetchBot) and refactored by @SnaveSutit to do line wrapping on JSON Text Components.
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
function getStylesFromComponent(component: JsonTextObject): StyleRecord {
	// TODO: Style inheritance
	const styles: StyleRecord = { color: 'white' }
	for (const key of STYLE_KEYS) {
		if (component[key]) {
			styles[key] = component[key]
		}
	}
	return styles
}

function flattenTextComponent(input: JsonTextComponent): JsonTextObject[] {
	const output: JsonTextObject[] = []
	function flattenComponent(component: JsonTextComponent, parentStyles: StyleRecord = {}) {
		if (Array.isArray(component)) {
			for (const subcomponent of component) {
				flattenComponent(subcomponent, parentStyles)
			}
		} else if (typeof component === 'string') {
			output.push(
				Object.assign({}, parentStyles, {
					text: component,
				}) as JsonTextObject
			)
		} else if (component instanceof JsonText) {
			flattenComponent(component.toJSON(), parentStyles)
		} else if (typeof component === 'object') {
			output.push(Object.assign({}, parentStyles, component, { extra: undefined }))
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
	if (typeof component === 'string') return component
	else if (component.text) return component.text
	else if (component.tl) return `{${component.tl}}`
	else return ''
}

export interface IStyleSpan {
	style: StyleRecord
	start: number
	end: number
}

export interface IComponentWord {
	styles: IStyleSpan[]
	text: string
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
				// A group of multiple spaces is treated as a word.
			} else if (char === '\n') {
				if (word) {
					if (Object.keys(style.style).length) {
						word.styles.push({ ...style })
						style.start = 0
						style.end = 0
					}
					words.push(word)
				}
				word = { styles: [], text: '', width: 0, forceWrap: true }
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
				word = { styles: [], text: '', width: 0 }
			}
			word.text += char
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

	let canvasWidth = 0
	let currentLine: IComponentLine = { words: [], width: 0 }
	// let lastSpaceWidth = 0
	for (const word of words) {
		// if (currentLine.words.length === 0 && word.text[0] === ' ') {
		// 	word.text = word.text.slice(1)
		// 	console.log(`Trimmed leading whitespace ${word.text}`)
		// }

		// lastSpaceWidth = font.getTextWidth(' ', {
		// 	start: 0,
		// 	end: 1,
		// 	style: word.styles.at(-1)!.style,
		// })
		const wordWidth = font.getWordWidth(word)
		const wordStyles = [...word.styles]
		// If the word is longer than than the max line width, split it into multiple lines
		if (wordWidth > maxLineWidth) {
			if (currentLine.words.length) {
				lines.push(currentLine)
				canvasWidth = Math.max(canvasWidth, currentLine.width)
			}
			currentLine = { words: [], width: 0 }

			let part = ''
			let partWidth = 0
			let partStartIndex = 0
			let style: IStyleSpan | undefined = wordStyles.shift()
			if (!style) throw new Error(`No active style found for word '${word.text}'`)

			for (let i = 0; i < word.text.length; i++) {
				const char = word.text[i]
				if (i >= style.end) {
					style = wordStyles.shift()
					if (!style)
						throw new Error(
							`No active style found for character '${char}' in word '${word.text}'`
						)
				}

				const charWidth = font.getTextWidth(char, style)
				if (part && partWidth + charWidth > maxLineWidth) {
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
					canvasWidth = Math.max(canvasWidth, partWidth)
					partStartIndex += part.length
					part = ''
					partWidth = 0
				}
				part += char
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
				canvasWidth = Math.max(canvasWidth, partWidth)
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
				// if (word.text[-1] === ' ') {
				// 	word.text = word.text.slice(0, -1)
				// 	wordWidth -= lastSpaceWidth
				// 	currentLine.width -= lastSpaceWidth
				// 	console.log(`Trimmed trailing whitespace ${word.text}`)
				// }
				canvasWidth = Math.max(canvasWidth, currentLine.width)
			}
			currentLine = { words: [], width: 0 }
			// If the current line has words and adding the current word would exceed the max line width, start a new line
		} else if (currentLine.words.length && currentLine.width + wordWidth > maxLineWidth) {
			lines.push(currentLine)
			// if (word.text.at(-1) === ' ') {
			// 	word.text = word.text.slice(0, -1)
			// 	wordWidth -= lastSpaceWidth
			// 	currentLine.width -= lastSpaceWidth
			// 	console.log(`Trimmed trailing whitespace ${word.text}`)
			// }
			canvasWidth = Math.max(canvasWidth, currentLine.width)
			currentLine = { words: [], width: 0 }
		}
		word.width = wordWidth
		currentLine.words.push(word)
		currentLine.width += wordWidth
	}
	if (currentLine.words.length) {
		lines.push(currentLine)
		// const word = currentLine.words.at(-1)!
		// if (word.text.at(-1) === ' ') {
		// 	word.text = word.text.slice(0, -1)
		// 	word.width -= lastSpaceWidth
		// 	currentLine.width -= lastSpaceWidth
		// 	console.log(`Trimmed trailing whitespace ${word.text}`)
		// }
		canvasWidth = Math.max(canvasWidth, currentLine.width)
	}

	console.timeEnd('computeTextWrapping')
	return { lines, canvasWidth }
}
