/**
 * Everything the palettes module needs from its host plugin. This is the only file in
 * `src/palettes/` that imports Animated Java, so splitting the module into its own plugin only
 * means rewriting this file.
 */
import { getFsModule } from '../constants'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { getAllJSONAssets, getRawAsset } from '../systems/minecraft/assetManager'
import { getItemModelAtlases } from '../systems/minecraft/textureAtlas'
import { createScopedTranslator } from '../util/lang'

export const translate = createScopedTranslator('palettes')

/** Whether palettes are available in the active project. */
export function isEnabled(): boolean {
	return activeProjectIsBlueprintFormat()
}

/** Whether palettes are available in `project`, which may not be selected yet. */
export function isEnabledFor(project: ModelProject): boolean {
	return project.format.id === BLUEPRINT_FORMAT_ID
}

export function getTargetVersion(): string {
	return Project!.animated_java.target_minecraft_version
}

/** The atlases item models can draw from on the target version, like `['items', 'blocks']`. */
export function getUsableAtlases(): string[] {
	return getItemModelAtlases(getTargetVersion())
}

/**
 * Reads a file from the target version's vanilla jar or the Preview resource packs, or undefined
 * if none of them has it.
 */
export async function readPackAsset(assetPath: string): Promise<Uint8Array | undefined> {
	try {
		return new Uint8Array(await getRawAsset(getTargetVersion(), assetPath))
	} catch {
		return undefined
	}
}

/** Every copy of an atlas file in the vanilla jar and the Preview packs, highest priority first. */
export async function readPackAtlases(atlas: string): Promise<Array<{ sources?: unknown[] }>> {
	return getAllJSONAssets(getTargetVersion(), `assets/minecraft/atlases/${atlas}.json`)
}

/** Reads a file from disk, or undefined if it can't be read. */
export async function readDiskFile(path: string): Promise<Uint8Array | undefined> {
	try {
		return new Uint8Array(await getFsModule().promises.readFile(path))
	} catch {
		return undefined
	}
}

export function diskFileExists(path: string): boolean {
	return getFsModule().existsSync(path)
}
