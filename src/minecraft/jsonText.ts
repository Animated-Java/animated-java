const PIXEL_FILTER =
	'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9ImZpbHRlciIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPSJpZGVudGl0eSIvPjxmZUZ1bmNHIHR5cGU9ImlkZW50aXR5Ii8+PGZlRnVuY0IgdHlwZT0iaWRlbnRpdHkiLz48ZmVGdW5jQSB0eXBlPSJkaXNjcmV0ZSIgdGFibGVWYWx1ZXM9IjAgMSIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48L2ZpbHRlcj48L3N2Zz4=#filter)'

const FONT = '16px MinecraftFull'

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

const COLOR_MAP: Record<string, string> = {
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

	renderToCanvas(): CanvasFrame {
		const canvas = new CanvasFrame(1, 1)
		canvas.ctx.font = FONT
		canvas.ctx.filter = PIXEL_FILTER

		function recurse(text: JsonTextComponent) {
			if (text instanceof Array) {
				text.forEach(recurse)
			} else if (typeof text === 'string') {
				//
			} else {
				canvas.ctx.fillStyle = text.color
					? text.color[0] === '#'
						? text.color
						: COLOR_MAP[text.color]
					: '#FFFFFF'
			}
		}

		recurse(this.text)

		// canvas.canvas.width = 0
		// canvas.canvas.height = 0

		return canvas
	}
}
