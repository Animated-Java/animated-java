// import { dirTreeItem } from '../dirTree'
// import { MCFunction } from './function'
// import { Path } from '../path'
// import { MCTag } from './tag'
// import * as pathjs from 'path'

// type packmetaJson = {
// 	pack: {
// 		description: string
// 		format: 6 | 7 | 8
// 	}
// }

// type namespace = {
// 	name: string
// 	functions: Array<MCFunction>
// 	tags: Array<MCTag>
// }

// class Datapack {
// 	public name: string
// 	public packmeta: packmetaJson
// 	public namespaces: Array<namespace>
// 	public dirTree: dirTreeItem

// 	constructor(name: string, path: Path, packmeta: packmetaJson) {
// 		this.name = name
// 		this.packmeta = packmeta
// 		this.dirTree = new dirTreeItem(
// 			this.name,
// 			path.join(this.name),
// 			'directory',
// 			undefined,
// 			undefined,
// 			[]
// 		)
// 	}

// 	addNamespace(name: string) {
// 		const treeItem = new dirTreeItem(
// 			name,
// 			new Path(this.dirTree.path, name),
// 			'directory',
// 			undefined,
// 			undefined
// 		)
// 		this.namespaces.push({
// 			name: name,
// 			functions: [],
// 			tags: [],
// 		})
// 	}

// 	toObject() {
// 		const ret = {}
// 	}
// }

// const datapack = new Datapack(
// 	'name',
// 	new Path(
// 		'C:/Users/Snave/Documents/github-repos/animated-java-experimental/debug_datapack'
// 	),
// 	{
// 		pack: {
// 			description: 'test pack',
// 			format: 8,
// 		},
// 	}
// )

// datapack.addNamespace('namespace')
