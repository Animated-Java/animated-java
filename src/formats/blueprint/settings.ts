import { join } from 'node:path'
import { getFsModule } from '../../constants'
import type { ValueCheckResult } from '../../svelteComponents/sidebarDialogItems/sidebarDialogTypes'
import { getVersionById } from '../../systems/minecraft/versionManager'
import { resolvePath } from '../../util/fileUtil'
import { createScopedTranslator } from '../../util/lang'
import { parseResourceLocation } from '../../util/minecraftUtil'

const localize = createScopedTranslator('dialog.blueprint_settings')

export type ExportMode = 'folder' | 'zip' | 'none'

export interface BlueprintSettings {
	blueprint_id: string

	show_render_box: boolean
	auto_render_box: boolean
	render_box: ArrayVector2
	// Export Settings
	enable_plugin_mode: boolean
	resource_pack_export_mode: ExportMode
	data_pack_export_mode: ExportMode
	target_minecraft_version: string
	// Resource Pack Settings
	display_item: string
	custom_model_data_offset: number
	enable_advanced_resource_pack_settings: boolean
	resource_pack: string
	// Data Pack Settings
	enable_advanced_data_pack_settings: boolean
	data_pack: string
	on_summon_function: string
	on_remove_function: string
	on_pre_tick_function: string
	on_post_tick_function: string
	interpolation_duration: number
	teleportation_duration: number
	custom_rig_entity_tags: string
	auto_update_rig_orientation: boolean
	use_storage_for_animation: boolean
	use_entity_stacking: boolean
	// Plugin Settings
	baked_animations: boolean
	json_file: string
}

export const defaultValues: BlueprintSettings = {
	blueprint_id: 'aj:my_blueprint',

	show_render_box: false,
	auto_render_box: true,
	render_box: [48, 48] as ArrayVector2,

	// Export Settings
	enable_plugin_mode: false,
	resource_pack_export_mode: 'folder' as ExportMode,
	data_pack_export_mode: 'folder' as ExportMode,
	target_minecraft_version: '26.1.2',

	// Resource Pack Settings
	display_item: 'minecraft:white_dye',
	custom_model_data_offset: 0,
	enable_advanced_resource_pack_settings: false,
	resource_pack: '',

	// Data Pack Settings
	enable_advanced_data_pack_settings: false,
	data_pack: '',

	on_summon_function: '',
	on_remove_function: '',
	on_pre_tick_function: '',
	on_post_tick_function: '',

	interpolation_duration: 1,
	teleportation_duration: 1,

	custom_rig_entity_tags: '',
	auto_update_rig_orientation: true,
	use_storage_for_animation: false,
	use_entity_stacking: false,
	// Plugin Settings
	baked_animations: true,
	json_file: '',
}

export function validateBlueprintId(value: string): ValueCheckResult {
	const parsed = parseResourceLocation(value)

	if (parsed.namespace === 'minecraft') {
		return {
			type: 'error',
			message: localize('blueprint_id.error.minecraft_namespace'),
		}
	}

	if (parsed.path === '') {
		return {
			type: 'error',
			message: localize('blueprint_id.error.empty_path'),
		}
	}

	if (parsed.namespace === 'animated_java' && parsed.path === 'global') {
		return {
			type: 'error',
			message: localize('blueprint_id.error.animated_java_global_id'),
		}
	}

	if (/[^a-z0-9_]/.exec(parsed.namespace) || /[^a-z0-9_\/]/.exec(parsed.path)) {
		return {
			type: 'error',
			message: localize('blueprint_id.error.invalid_characters'),
		}
	}
}

export function validateTextureSize(valueX: number, valueY: number): ValueCheckResult {
	const largestWidth = Texture.all.reduce((largest, t) => Math.max(largest, t.width), 0)
	const largestHeight = Texture.all.reduce(
		(largest, t) => Math.max(largest, t.frameCount ? t.width : t.height),
		0
	)

	if (valueX !== largestWidth) {
		return {
			type: 'warning',
			message: localize(
				'texture_size.warning.does_not_match_largest_width',
				String(largestWidth)
			),
		}
	}

	if (valueY !== largestHeight) {
		return {
			type: 'warning',
			message: localize(
				'texture_size.warning.does_not_match_largest_height',
				String(largestHeight)
			),
		}
	}

	if (valueX !== valueY) {
		return {
			type: 'warning',
			message: localize('texture_size.warning.not_square'),
		}
	}

	// Both values are identical at this point, so we only need to check one of them for being a power of two
	if (valueX !== 2 ** Math.floor(Math.log2(valueX))) {
		return {
			type: 'warning',
			message: localize('texture_size.warning.not_a_power_of_2'),
		}
	}
}

export async function validateTargetMinecraftVersion(value: string): Promise<ValueCheckResult> {
	try {
		VersionUtil.parse(value)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error: any) {
		return {
			type: 'error',
			message: localize('target_minecraft_version.error.invalid_version_format'),
		}
	}

	if (VersionUtil.compare(value, '<', '1.20.4')) {
		return {
			type: 'error',
			message: localize('target_minecraft_version.error.early_versions_not_supported'),
		}
	}

	try {
		await getVersionById(value)
	} catch (error: any) {
		return {
			type: 'error',
			message: error.message,
		}
	}
}

export function validateResourcePackFolder(value: string): ValueCheckResult {
	if (value === '') {
		return {
			type: 'error',
			message: localize('resource_pack.folder.error.empty'),
		}
	}

	let path: string
	try {
		path = resolvePath(value)
	} catch (error: any) {
		console.error(error)
		return {
			type: 'error',
			message: localize('resource_pack.folder.error.invalid_path', error.message),
		}
	}

	const { existsSync, statSync } = getFsModule()

	if (!existsSync(path)) {
		return {
			type: 'error',
			message: localize('resource_pack.folder.error.does_not_exist'),
		}
	}

	if (!statSync(path).isDirectory()) {
		return {
			type: 'error',
			message: localize('resource_pack.folder.error.not_a_dir'),
		}
	}

	if (!existsSync(join(path, 'pack.mcmeta'))) {
		return {
			type: 'error',
			message: localize('resource_pack.folder.error.no_pack_mcmeta'),
		}
	}

	if (!existsSync(join(path, 'assets'))) {
		return {
			type: 'warning',
			message: localize('resource_pack.folder.warning.no_assets'),
		}
	}
}

export function validateDataPackFolder(value: string): ValueCheckResult {
	if (value === '') {
		return {
			type: 'error',
			message: localize('data_pack.folder.error.empty'),
		}
	}

	let path: string
	try {
		path = resolvePath(value)
	} catch (error: any) {
		console.error(error)
		return {
			type: 'error',
			message: localize('data_pack.folder.error.invalid_path', error.message),
		}
	}

	const { existsSync, statSync } = getFsModule()

	if (!existsSync(path)) {
		return {
			type: 'error',
			message: localize('data_pack.folder.error.does_not_exist'),
		}
	}

	if (!statSync(path).isDirectory()) {
		return {
			type: 'error',
			message: localize('data_pack.folder.error.not_a_dir'),
		}
	}

	if (!existsSync(join(path, 'pack.mcmeta'))) {
		return {
			type: 'error',
			message: localize('data_pack.folder.error.no_pack_mcmeta'),
		}
	}

	if (!existsSync(join(path, 'data'))) {
		return {
			type: 'warning',
			message: localize('data_pack.folder.warning.no_data'),
		}
	}
}

export function validateZipPath(value: string): ValueCheckResult {
	if (value === '') {
		return {
			type: 'error',
			message: localize('data_pack.zip.error.empty'),
		}
	}

	let path: string
	try {
		path = resolvePath(value)
	} catch (error: any) {
		console.error(error)
		return {
			type: 'error',
			message: localize('data_pack.zip.error.invalid_path', error.message),
		}
	}

	if (!/\.zip$/i.test(path)) {
		return {
			type: 'error',
			message: localize('data_pack.zip.error.require_zip_extension'),
		}
	}
}

export async function validateThisProjectsBlueprintSettings(): Promise<
	Record<string, ValueCheckResult | undefined>
> {
	return {
		blueprint_id: validateBlueprintId(Project.animated_java.blueprint_id),
		target_minecraft_version: await validateTargetMinecraftVersion(
			Project.animated_java.target_minecraft_version
		),
		texture_size: validateTextureSize(
			Project.animated_java.render_box[0],
			Project.animated_java.render_box[1]
		),
		resource_pack_folder:
			Project.animated_java.resource_pack_export_mode === 'folder'
				? validateResourcePackFolder(Project.animated_java.resource_pack)
				: undefined,
		data_pack_folder:
			Project.animated_java.data_pack_export_mode === 'folder'
				? validateDataPackFolder(Project.animated_java.data_pack)
				: undefined,
		data_pack_zip:
			Project.animated_java.data_pack_export_mode === 'zip'
				? validateZipPath(Project.animated_java.data_pack)
				: undefined,
	}
}
