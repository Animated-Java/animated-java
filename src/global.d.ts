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
