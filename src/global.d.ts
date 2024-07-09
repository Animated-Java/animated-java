/// <reference path="blockbenchTypeMods.d.ts" />

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
