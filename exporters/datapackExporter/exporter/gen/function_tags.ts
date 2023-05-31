import { type IFolders } from './datapack'
import { Globals as G } from './globals'

function tagMerger(a: any, b: any) {
	a.values = a.values.filter(v => !b.values.includes(v))
	a.values.push(...b.values)
	return a
}

export function generateTags(folders: IFolders) {
	const minecraftFunctionTagFolder = folders.minecraft.tags.newFolder('functions')
	minecraftFunctionTagFolder
		.chainNewFile(
			'load.json',
			{ replace: false, values: [`${G.PROJECT_PATH}/load`] },
			tagMerger
		)
		.chainNewFile(
			'tick.json',
			{ replace: false, values: [`${G.INTERNAL_PATH}/tick`] },
			tagMerger
		)

	const animatedJavafunctionTagFolder = folders.animatedJava.tags.newFolder(
		`functions/${G.PROJECT_NAME}`
	)
	animatedJavafunctionTagFolder
		.newFolder('on_load')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locators.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_targets.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_cameras.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_targets.json', { replace: false, values: [] }, tagMerger)
	animatedJavafunctionTagFolder
		.newFolder('on_tick')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locators.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_targets.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_cameras.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_targets.json', { replace: false, values: [] }, tagMerger)
	animatedJavafunctionTagFolder
		.newFolder('on_summon')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locators.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_targets.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_cameras.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_targets.json', { replace: false, values: [] }, tagMerger)
	animatedJavafunctionTagFolder
		.newFolder('on_remove')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locators.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_targets.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_cameras.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_targets.json', { replace: false, values: [] }, tagMerger)
}
