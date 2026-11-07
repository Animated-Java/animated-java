declare module 'three' {
	interface Object3D {
		isVanillaItemModel?: boolean
		isVanillaBlockModel?: boolean
		isTextDisplayText?: boolean
		fix_scale?: THREE.Vector3
	}
}

declare global {
	namespace Interface.CustomElements {
		/** Blockbench's number field with a drag-to-change handle, as used by dialog forms. */
		class NumericInput {
			node: HTMLElement
			value: number
			constructor(
				id: string,
				options: {
					value?: number
					min?: number
					max?: number
					step?: number
					readonly?: boolean
					onChange?(value: number, event: Event): void
				}
			)
		}
	}

	interface NullObject {
		/** UUID of the bone the IK chain starts at. Empty means the null's parent. */
		ik_source: string
	}

	namespace StartScreen {
		/** Reloads the recent-projects thumbnails, or only those of the given project paths. */
		function updateThumbnails(paths?: string[]): void
	}
}

export {}
