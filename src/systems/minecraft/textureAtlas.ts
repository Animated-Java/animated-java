export type TextureAtlasEntry =
	| {
			type: 'directory'
			source: string
			prefix: string
	  }
	| {
			type: 'single'
			resource: string
			sprite?: string
	  }
	| {
			type: 'filter'
			namespace?: string
			path?: string
	  }
	| {
			type: 'unstitch'
			resource: string
			divisor_x: number
			divisor_y: number
			regions: Array<{
				sprite: string
				x: number
				y: number
				width: number
				height: number
			}>
	  }
	| {
			type: 'paletted_permutations'
			textures: string[]
			palette_key: string
			permutations: Record<string, string>
	  }

export interface ITextureAtlas {
	sources: TextureAtlasEntry[]
}
