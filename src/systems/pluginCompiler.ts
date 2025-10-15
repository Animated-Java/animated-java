namespace PluginBlueprint {
	type TextureAnimationFrame =
		| number
		| {
				index: number
				time?: number
		  }

	interface TextureAnimation {
		width?: number
		height?: number
		interpolate?: boolean
		frametime?: number
		frames?: TextureAnimationFrame[]
	}

	interface CustomTexture {
		type: 'custom'
		base64: string
		mime_type: 'image/png'
		animation?: TextureAnimation
	}

	interface ReferenceTexture {
		type: 'reference'
		resource_location: string
	}

	export type Texture = CustomTexture | ReferenceTexture

	export interface Json {
		format_version: string
		settings: {
			id: string
		}
		textures: Record<string, Texture>
	}
}

// export function compilePluginBlueprint(): PluginBlueprint.Json {
// 	const blueprint: PluginBlueprint.Json = {}

// 	return blueprint
// }
