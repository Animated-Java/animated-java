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
}

export {}
