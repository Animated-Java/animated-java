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

	renderToCanvas(): TextCanvas {
		const textCanvas = new TextCanvas()

		this._renderToCanvas(this.text, textCanvas)
		// textCanvas.canvas.width = textCanvas.width
		// textCanvas.canvas.height = textCanvas.height
		textCanvas.render()

		return textCanvas
	}

	private _renderToCanvas(comp: JsonTextComponent, textCanvas: TextCanvas) {
		if (comp instanceof Array) {
			console.log('array', comp)
			comp.forEach(c => this._renderToCanvas(c, textCanvas))
		} else if (typeof comp === 'string') {
			console.log('string', comp)
		} else {
			console.log('obj', comp)
			this._renderObj(comp, textCanvas)
		}
	}

	private _renderObj(obj: JsonTextObject, textCanvas: TextCanvas) {
		const writeOptions: Record<string, any> = {}
		// canvas.ctx.font = FONT
		if (obj.color)
			writeOptions.fillStyle = obj.color[0] === '#' ? obj.color : COLOR_MAP[obj.color]

		if (obj.bold) writeOptions.font = 'bold ' + FONT
		if (obj.italic) writeOptions.font = 'italic ' + FONT
		// if (obj.underlined) canvas.canvas.style.textDecoration = 'underline'
		// if (obj.strikethrough) canvas.canvas.style.textDecoration = 'line-through'
		// if (obj.obfuscated) canvas.canvas.style.textDecoration = 'blink'

		if (obj.text) {
			textCanvas.write(obj.text, writeOptions)
		} else if (obj.score) {
			textCanvas.write(
				obj.score.value === undefined
					? `(${obj.score.name} ${obj.score.objective})`
					: obj.score.value.toString(),
				writeOptions
			)
		} else if (obj.nbt) {
			let text = `${obj.nbt}`
			if (obj.block) text += ` ${obj.block}`
			else if (obj.entity) text += ` ${obj.entity}`
			else if (obj.storage) text += ` ${obj.storage}`
			textCanvas.write(text, writeOptions)
		} else if (obj.selector) {
			textCanvas.write(`(${obj.selector})`, writeOptions)
		}
	}
}

interface TextBit {
	canvas: CanvasFrame
	posX: number
	posY: number
}

class TextCanvas {
	canvasFrame: CanvasFrame
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D

	private textBits: TextBit[] = []

	currentX = 0
	currentY = 0

	constructor() {
		this.canvasFrame = new CanvasFrame(1, 1)
		this.canvas = this.canvasFrame.canvas
		this.ctx = this.canvasFrame.ctx
	}

	get width() {
		return this.canvas.width
	}

	set width(width: number) {
		this.canvas.width = width
	}

	get height() {
		return this.canvas.height
	}

	set height(height: number) {
		this.canvas.height = height
	}

	write(text: string, writeOptions: Record<string, any> = {}) {
		const measure = new CanvasFrame(1, 1)
		measure.ctx.font = FONT
		measure.ctx.filter = PIXEL_FILTER
		const metrics = measure.ctx.measureText(text)
		const width = Math.ceil(metrics.width)
		const height = Math.ceil(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)

		const canvas = new CanvasFrame(width, height)
		canvas.ctx.font = FONT
		canvas.ctx.filter = PIXEL_FILTER
		canvas.ctx.fillStyle = '#ffffff'
		canvas.ctx.textBaseline = 'top'

		Object.assign(canvas.ctx, writeOptions)

		canvas.ctx.fillText(text, 0, 0)

		this.textBits.push({ canvas, posX: this.currentX, posY: this.currentY })

		this.currentX += width
		// this.currentY += height
	}

	render() {
		console.log('rendering', this.textBits)

		const totalWidth = this.textBits.reduce((acc, bit) => acc + bit.canvas.width, 0)
		const totalHeight = this.textBits.reduce((acc, bit) => Math.max(acc, bit.canvas.height), 0)

		this.width = totalWidth
		this.height = totalHeight

		for (const bit of this.textBits) {
			console.log('drawing', bit)
			this.ctx.drawImage(bit.canvas.canvas, bit.posX, bit.posY)
		}
	}
}
