// @ts-ignore
import fontUrl from '../assets/MinecraftFull.ttf'

if ([...document.fonts.keys()].filter(v => v.family === 'MinecraftFull').length === 0) {
	void new FontFace('MinecraftFull', fontUrl as Buffer, {}).load().then(font => {
		document.fonts.add(font)
	})
}

export const PIXEL_FILTER =
	'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxmaWx0ZXIgaWQ9ImZpbHRlciIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPSJpZGVudGl0eSIvPjxmZUZ1bmNHIHR5cGU9ImlkZW50aXR5Ii8+PGZlRnVuY0IgdHlwZT0iaWRlbnRpdHkiLz48ZmVGdW5jQSB0eXBlPSJkaXNjcmV0ZSIgdGFibGVWYWx1ZXM9IjAgMSIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48L2ZpbHRlcj48L3N2Zz4=#filter)'

export const FONT = '16px MinecraftFull'

export * from './entities'
export * from './items'
export * from './util'
export * from './jsonText'
export * from './searchGenerator'
// export * from './registryLoader'
