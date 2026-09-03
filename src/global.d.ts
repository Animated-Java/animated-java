/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench/types/index.d.ts"/>
/// <reference path="./blockbenchTypeMods.d.ts"/>

declare module '*.png' {
	const value: string
	export = value
}

declare module '*.ttf' {
	const value: string
	export = value
}

declare module '*.gif' {
	const value: string
	export = value
}

declare module '*.svg' {
	const value: string
	export = value
}

declare module '*.webp' {
	const value: string
	export = value
}

declare module '*.mcb' {
	const value: string
	export = value
}

declare module '*.mcbt' {
	const value: string
	export = value
}

declare module '*.txt' {
	const value: string
	export = value
}

/**
 * Auto-discovered MC-Build datapack sources, one entry per version directory
 * under the resolved path. Provided by `.scripts/plugins/mcbCompressionPlugin.ts`.
 * Each field is present only if that version directory contains the file.
 */
declare module 'mcb-sources:*' {
	interface MCBVersionSources {
		main?: string
		global?: string
		globalTemplates?: string
	}
	const sources: Record<string, MCBVersionSources>
	export default sources
}

declare module '*.worker.ts' {
	export = Worker
}

declare module '*.molang' {
	const value: Record<string, string>
	export = value
}

declare module 'fflate/browser' {
	export * from 'fflate'
}

declare module '*.css' {
	const value: string
	export = value
}

declare module 'deepslate/lib/nbt' {
	export * from 'deepslate/nbt'
}

declare module 'block-model-renderer/assets.zip' {
	const url: string
	export default url
}

declare module 'block-model-renderer' {
	interface AssetHandler {
		read(
			path: string
		): Uint8Array | string | null | undefined | Promise<Uint8Array | string | null | undefined>
		list(dir: string): string[] | Promise<string[]>
		filter?: unknown[]
	}

	/** Opaque, normalized asset bundle returned by {@link prepareAssets}. */
	type PreparedAssets = unknown[] & { readonly __prepared: unique symbol }

	/** A single model reference / inline model, as passed between the low level scene functions. */
	type ModelReference = Record<string, unknown>

	type DisplayTransform =
		| string
		| {
				type?: 'fallback'
				display?: string
				rotation?: [number, number, number]
				translation?: [number, number, number]
				scale?: [number, number, number]
		  }

	export function configure(opts: { THREE?: unknown; three?: unknown; assetsUrl?: string }): void

	export function getThree(): Promise<unknown>

	export function prepareAssets(
		sources: Array<AssetHandler | Uint8Array | ArrayBuffer | string>,
		options?: {
			cache?: boolean
			version?: string
			translucency?: { min: number; max: number }
		}
	): Promise<PreparedAssets>

	export function disposeCache(assets: PreparedAssets): void

	export function parseBlockstate(
		assets: PreparedAssets,
		id: string,
		args?: {
			data?: Record<string, string>
			seed?: number
			ignoreAtlases?: boolean
			version?: string
		}
	): Promise<ModelReference[]>

	export function parseItemDefinition(
		assets: PreparedAssets,
		id: string,
		args?: {
			data?: Record<string, unknown>
			display?: string
			ignoreAtlases?: boolean
			version?: string
		}
	): Promise<ModelReference[]>

	export function resolveModelData(
		assets: PreparedAssets,
		model: ModelReference | string
	): Promise<ModelReference>

	export function loadModel(
		scene: THREE.Scene | null,
		assets: PreparedAssets,
		model: ModelReference,
		args?: {
			display?: DisplayTransform
			lighting?: 'item' | 'world' | 'scene' | 'off'
			version?: string
			animate?: boolean
			cull?: Set<string> | Record<string, boolean>
		}
	): Promise<THREE.Group>

	export function makeModelScene(): Promise<{
		scene: THREE.Scene
		camera: THREE.Camera
	}>

	export function isCrossModel(models: ModelReference | ModelReference[]): boolean
}

/**
 * Import this folder's contents recursively.
 * If a local index is found in a folder, it is imported and the rest of that folder is ignored.
 */
declare module 'import_folder_recursive:*' {
	const value: any
	export default value
}

/**
 * Import this folder's contents, ignoring subdirectories.
 * If a local index is found in a folder, it is imported and the rest of that folder is ignored.
 */
declare module 'import_folder:*' {
	const value: any
	export default value
}
