import { type IFolders } from './datapack'
// import { Globals as G } from './globals'

// function tagMerger(a: any, b: any) {
// 	a.values = a.values.filter(v => !b.values.includes(v))
// 	a.values.push(...b.values)
// 	return a
// }

export function generateEntityTypes(folders: IFolders) {
	const animatedJavaEntityTypesFolder = folders.animatedJava.tags
		.newFolder('entity_types')
		.chainNewFile('root.json', { replace: false, values: ['minecraft:item_display'] })
		.chainNewFile('bone.json', { replace: false, values: ['minecraft:item_display'] })
		.chainNewFile('locator_origin.json', { replace: false, values: ['minecraft:snowball'] })
		.chainNewFile('camera_origin.json', { replace: false, values: ['minecraft:snowball'] })
}
