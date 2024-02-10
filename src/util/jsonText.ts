export const FONT = '16px MinecraftFull'

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
	| `#${string}`

export const COLOR_MAP: Record<string, string> = {
	dark_red: '#AA0000',
	red: '#FF5555',
	gold: '#FFAA00',
	yellow: '#FFFF55',
	dark_green: '#00AA00',
	green: '#55FF55',
	aqua: '#55FFFF',
	dark_aqua: '#00AAAA',
	dark_blue: '#0000AA',
	blue: '#5555FF',
	light_purple: '#FF55FF',
	dark_purple: '#AA00AA',
	white: '#FFFFFF',
	gray: '#AAAAAA',
	dark_gray: '#555555',
	black: '#000000',
}

type JsonTextObject = {
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
		name: string
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

type JsonTextComponent = string | JsonTextArray | JsonTextObject

type JsonTextArray = JsonTextComponent[] | string[]

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
