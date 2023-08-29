import { IFolders } from './datapack'
import { generateSummonFunction } from './functions/summonFunction'

export class MCFunction {
	static all: MCFunction[] = []

	file: AnimatedJava.VirtualFile

	constructor(
		public folder: AnimatedJava.VirtualFolder,
		public name: string,
		public content: string[] = []
	) {
		this.file = folder.newFile(`${name}.mcfunction`, this.content)
		MCFunction.all.push(this)
	}

	getResourceLocation() {
		const parsed = AnimatedJava.API.minecraft.parseResourcePath(this.file.path)
		if (!parsed)
			throw new Error(`Failed to parse resource path for mcfunction at '${this.file.path}'`)
		return parsed.resourceLocation
	}

	toString() {
		return `function ${this.getResourceLocation()}`
	}
}

export function generateFunctions(folders: IFolders) {
	generateSummonFunction(folders)
}
