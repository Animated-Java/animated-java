import { selectorString } from './types'

type JsonTextColor =
	| 'dark_red'
	| 'red'
	| 'gold'
	| 'yellow'
	| 'dark_green'
	| 'green'
	| 'aqua'
	| 'dark_aqua'
	| 'dark_blue'
	| 'blue'
	| 'light_purple'
	| 'dark_purple'
	| 'white'
	| 'gray'
	| 'dark_gray'
	| 'black'

type JsonTextComponent =
	| string
	| JsonTextArray
	| {
			text?: string
			font?: string
			color?: JsonTextColor
			extra?: JsonTextArray
			bold?: true | false
			italic?: true | false
			underlined?: true | false
			strikethrough?: true | false
			obfuscated?: true | false
			insertion?: string
			clickEvent?: {
				action:
					| 'open_url'
					| 'open_file'
					| 'run_command'
					| 'suggest_command'
					| 'change_page'
					| 'copy_to_clipboard'
				value: string
			}
			hoverEvent?: {
				action: 'show_text' | 'show_item' | 'show_entity'
				contents:
					| JsonTextComponent
					| {
							type: string
							id: string
							name?: string
					  }
					| {
							id: string
							count?: number
							tag?: string
					  }
			}
			tl?: string
			with?: JsonTextArray
			score?: {
				name: selectorString
				objective: string
				value?: number
			}
			selector?: string
			separator?: string
			keybind?: string
			nbt?: string
			block?: string
			entity?: string
			storage?: string
	  }

type JsonTextArray = Array<JsonTextComponent> | Array<string>

export class JsonText {
	private text: JsonTextComponent
	constructor(jsonText: JsonTextComponent) {
		this.text = jsonText
	}

	toString() {
		return JSON.stringify(this.text)
	}

	toJSON() {
		return this.text
	}
}
