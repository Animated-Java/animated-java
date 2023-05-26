import { generateFunctions } from './functions'
import { Globals as G } from './globals'

export interface IFolders {
	datapack: AnimatedJava.VirtualFolder
	data: AnimatedJava.VirtualFolder
	animatedJava: {
		root: AnimatedJava.VirtualFolder
		functions: AnimatedJava.VirtualFolder
		tags: AnimatedJava.VirtualFolder
	}
	project: {
		functions: AnimatedJava.VirtualFolder
		internalFunctions: AnimatedJava.VirtualFolder
		tags: AnimatedJava.VirtualFolder
	}
}

export function generateDatapack() {
	const { VirtualFileSystem } = AnimatedJava.API

	const folders = {} as IFolders
	folders.datapack = new VirtualFileSystem.VirtualFolder('internal_datapack_folder')
	folders.data = folders.datapack.newFolder('data')

	folders.animatedJava.root = folders.data.newFolder('animated_java')
	folders.animatedJava.functions = folders.animatedJava.root.newFolder('functions')
	folders.animatedJava.tags = folders.animatedJava.root.newFolder('tags')

	folders.project.functions = folders.animatedJava.functions.newFolder(G.PROJECT_NAME)
	folders.project.tags = folders.animatedJava.tags.newFolder(G.PROJECT_NAME)
	folders.project.internalFunctions = folders.project.functions.newFolder('zzzzzzzz')

	const ajMeta = folders.datapack.newFile('.ajmeta', {})

	generateFunctions(folders)
}
