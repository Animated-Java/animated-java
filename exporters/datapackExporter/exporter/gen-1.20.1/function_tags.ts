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
			{ replace: false, values: [`${G.INTERNAL_PATH}/load`] },
			tagMerger
		)
		.chainNewFile('tick.json', { replace: false, values: [`animated_java:tick`] }, tagMerger)

	const animatedJavaFunctionTagFolder = folders.animatedJava.tags.newFolder(`functions`)
	animatedJavaFunctionTagFolder.newFile(
		'rig_tick.json',
		{ replace: false, values: [`${G.INTERNAL_PATH}/tick`] },
		tagMerger
	)

	const projectFunctionTagFolder = animatedJavaFunctionTagFolder.newFolder(`${G.PROJECT_NAME}`)
	projectFunctionTagFolder
		.newFolder('on_load')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_entities.json', { replace: false, values: [] }, tagMerger)
	projectFunctionTagFolder
		.newFolder('on_tick')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_entities.json', { replace: false, values: [] }, tagMerger)
	projectFunctionTagFolder
		.newFolder('on_summon')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_entities.json', { replace: false, values: [] }, tagMerger)
	projectFunctionTagFolder
		.newFolder('on_remove')
		.chainNewFile('as_root.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_rig_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_bones.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_locator_entities.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_origins.json', { replace: false, values: [] }, tagMerger)
		.chainNewFile('as_camera_entities.json', { replace: false, values: [] }, tagMerger)
}
