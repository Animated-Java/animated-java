import {
	TextComponent,
	UnicodeString,
	type TextComponentStyle,
	type TextElement,
	type TextObject,
} from 'book-and-quill'
import { Stopwatch } from '../../util/stopwatch'
import { MinecraftFont } from '../minecraft/fontManager'

// Jumpstarted by @IanSSenne (FetchBot) and refactored by @SnaveSutit to do line wrapping on JSON Text Components.
// THANK U IAN <3 - SnaveSutit

const KEYBIND_KEY_MAP: Record<string, string> = {
	'key.advancements': 'L',
	'key.attack': 'key.mouse.left',
	'key.back': 'S',
	'key.chat': 'T',
	'key.command': '/',
	'key.drop': 'Q',
	'key.forward': 'W',
	'key.fullscreen': 'F11',
	'key.hotbar.1': '1',
	'key.hotbar.2': '2',
	'key.hotbar.3': '3',
	'key.hotbar.4': '4',
	'key.hotbar.5': '5',
	'key.hotbar.6': '6',
	'key.hotbar.7': '7',
	'key.hotbar.8': '8',
	'key.hotbar.9': '9',
	'key.inventory': 'E',
	'key.jump': 'Space',
	'key.left': 'A',
	'key.loadToolbarActivator': 'X',
	'key.pickItem': 'key.mouse.middle',
	'key.playerlist': 'Tab',
	'key.quickActions': 'Quick Actions',
	'key.right': 'D',
	'key.saveToolbarActivator': 'G',
	'key.screenshot': 'F2',
	'key.smoothCamera': 'Toggle Cinematic Camera',
	'key.sneak': 'Left Shift',
	'key.socialInteractions': 'P',
	'key.spectatorHotbar': 'key.keyboard.unknown',
	'key.spectatorOutlines': 'key.keyboard.unknown',
	'key.sprint': 'Left Control',
	'key.swapOffhand': 'F',
	'key.toggleGui': 'F1',
	'key.togglePerspective': 'F5',
	'key.toggleSpectatorShaderEffects': 'F4',
	'key.use': 'key.mouse.right',
}

async function getLangTranslation(key: string): Promise<string> {
	const lang = await AnimatedJava.assetManager.getJSONAsset(
		Project.animated_java.target_minecraft_version,
		'assets/minecraft/lang/en_us.json'
	)
	return lang[key] ?? key
}

async function getKeybindTranslation(keybind: string): Promise<string> {
	const mappedKeybind = KEYBIND_KEY_MAP[keybind] ?? keybind
	return getLangTranslation(mappedKeybind)
}

async function getRawText(element: string | TextObject): Promise<UnicodeString> {
	if (typeof element === 'string') {
		return new UnicodeString(element)
	}

	switch (true) {
		case element.text !== undefined:
			return new UnicodeString(element.text)

		case element.translate !== undefined:
			const translation = await getLangTranslation(element.translate)
			return new UnicodeString(
				translation === element.translate ? `{${element.translate}}` : translation
			)

		case element.selector !== undefined:
			return new UnicodeString(`{${element.selector}}`)

		case element.score !== undefined:
			return new UnicodeString(`{${element.score.name}:${element.score.objective}}`)

		case element.keybind !== undefined:
			const keybindTranslation = await getKeybindTranslation(element.keybind)
			return new UnicodeString(
				element.keybind === keybindTranslation ? `{${element.keybind}}` : keybindTranslation
			)

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
	style: TextComponentStyle
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
export async function parseWords(inputElement: TextElement) {
	const stopwatch = new Stopwatch('Parse Words').start()
	const optimized = new TextComponent(inputElement).optimized(true)
	if (!optimized.length) return []
	const words: Word[] = []

	let word: Word | undefined
	let element = optimized.shift()
	if (Array.isArray(element)) {
		throw new Error('Unexpected array element in optimized JSON Text')
	}
	if (element === undefined) return words

	let componentText = await getRawText(element)
	let span: StyleSpan = {
		style: TextComponent.getComponentStyle(element),
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

		element = optimized.shift()
		if (Array.isArray(element)) {
			throw new Error('Unexpected array element in optimized JSON Text')
		}

		if (element !== undefined) {
			componentText = await getRawText(element)
			if (word) {
				word.styles.push(span)
				span = {
					style: TextComponent.getComponentStyle(element),
					start: span.end,
					end: span.end,
				}
			} else {
				span = {
					style: TextComponent.getComponentStyle(element),
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

export async function wrapJsonText(jsonText: TextComponent, maxLineWidth = 200) {
	const stopwatch = new Stopwatch('Wrap Json Text').start()

	const words = await parseWords(jsonText.toJSON())
	const lines: Line[] = []
	// FIXME - This will not work for custom fonts
	const font = await MinecraftFont.getById('minecraft:default')

	let backgroundWidth = 0
	let currentLine: Line = { words: [], width: 0 }
	for (const word of words) {
		const wordWidth = await font.getWordWidth(word)
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

				const charWidth = await font.getTextWidth(new UnicodeString(char), style)
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
