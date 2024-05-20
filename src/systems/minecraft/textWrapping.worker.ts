import type { JsonText, JsonTextComponent, JsonTextObject } from './jsonText'
import type { IComponentWord, IStyleSpan, StyleRecord } from './textWrapping'

const STYLE_KEYS = [
	'bold',
	'italic',
	'underlined',
	'strikethrough',
	'obfuscated',
	'color',
	'font',
] as const

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

function getText(component: JsonTextObject) {
	if (typeof component === 'string') return component
	else if (component.text) return component.text
	else if (component.tl) return `{${component.tl}}`
	else return ''
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
		} else if (Object.hasOwn(component, 'isJsonTextClass')) {
			flattenComponent((component as JsonText).toJSON(), parentStyles)
		} else if (typeof component === 'object') {
			component = component as JsonTextObject
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
/**
 * Gets the words from a JSON Text Component, while keeping track of the styles applied to each word.
 *
 * WARNING: Word width is not calculated by this function.
 */
function getComponentWords(input: JsonTextComponent) {
	console.time('getComponentWords')
	const flattenedComponents = flattenTextComponent(input)
	console.log('Flattened components:', flattenedComponents)
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
				if (word) {
					word.text += char
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
				word = { styles: [], text: '', width: 0, forceWrap: true }
			} else {
				if (!word) {
					word = { styles: [], text: '', width: 0 }
				}
				word.text += char
				style.end++
			}
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

addEventListener('message', ({ data }) => {
	switch (data.type) {
		case 'getComponentWords': {
			console.log('Received getComponentWords request', data.args)
			const result = getComponentWords(...(data.args as [JsonTextComponent]))
			console.log('Sending getComponentWords result', result)
			postMessage(result)
			break
		}
	}
})
