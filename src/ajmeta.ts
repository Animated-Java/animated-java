import * as fs from 'fs/promises'
import * as PACKAGE from '../package.json'

export interface IAJMetaJSON {
	version?: string
	projects: Record<string, IAJMetaProject>
}

export interface IAJMetaProject {
	project_name: string
	file_list: string[]
}

export class AJMetaFile {
	version: string = PACKAGE.version
	projects: Record<string, IAJMetaProject> = {}

	constructor() {
		this.projects = {}
	}

	addProject(uuid: string, projectName: string, fileList: string[]): IAJMetaProject {
		const project = { project_name: projectName, file_list: fileList }
		this.projects[uuid] = project
		return project
	}

	getProject(uuid: string): IAJMetaProject | undefined {
		return this.projects[uuid]
	}

	toJSON(): IAJMetaJSON {
		return {
			version: PACKAGE.version,
			projects: this.projects,
		}
	}

	async load(path: string): Promise<AJMetaFile> {
		this.projects = {}

		const stringContent = await fs.readFile(path, 'utf-8').catch(e => {
			console.warn(`Could not read ajmeta file at ${path}: ${e as string}`)
			return '{}'
		})

		let content: IAJMetaJSON
		try {
			content = JSON.parse(stringContent)
		} catch (e: any) {
			throw new Error(`Invalid ajmeta file: ${e as string}`)
		}

		this.version = content.version || PACKAGE.version
		this.projects = content.projects || {}

		return this
	}
}
