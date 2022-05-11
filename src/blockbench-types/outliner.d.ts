// @ts-ignore
type ArrayVector3 = [number, number, number]
type ArrayVector2 = [number, number]

/**
 * @private
 */
declare class OutlinerNode {
	constructor()
	uuid: UUID
	export: boolean
	locked: boolean
	parent: Group | 'root'
	init: () => this
	addTo: (target?: OutlinerNode) => this
	sortInBefore: (target?: OutlinerNode, index_modifier?: number) => this
	getParentArray: () => OutlinerNode[]
	/**
	 * Unfolds the outliner and scrolls up or down if necessary to show the group or element.
	 */
	showInOutliner: () => this
	/**
	 * Updates the vue node of the element. This is only necessary in some rare situations
	 */
	updateElement: () => this
	/**
	 * Removes the element.
	 */
	remove: () => this
	/**
	 * Marks the name of the group or element in the outliner for renaming.
	 */
	rename: () => this
	/**
	 * Saves the changed name of the element by creating an undo point and making the name unique if necessary.
	 */
	saveName: () => this
	/**
	 * Create a unique name for the group or element by adding a number at the end or increasing it.
	 */
	createUniqueName: () => this
	/**
	 * Checks of the group or element is a child of `group`.
	 * @param max_levels The maximum number of generations that can be between the element and the group
	 */
	isChildOf: (group: Group, max_levels: number) => boolean
	/**
	 * Displays the context menu of the element
	 * @param event Mouse event, determines where the context menu spawns.
	 */
	showContexnu: (event: Event | HTMLElement) => this
}

/**
 * @private
 */
declare class OutlinerElement extends OutlinerNode {
	constructor()
	selected: boolean
	static fromSave: (data: object, keep_uuid?: boolean) => OutlinerElement
	static isParent: false
}

interface GroupOptions {
	/**Group name */
	name: string
	/**Array of the group pivot point */
	origin: ArrayVector3
	/**Array of the group rotation */
	rotation: ArrayVector3
	/**If a bone, whether to reset the informations of inherited bones in bedrock edition. */
	reset: boolean
	/**Whether to shade the contents of the group */
	shade: boolean
	/**Whether the group is selected */
	selected: boolean
	/**Whether the group is visible */
	visibility: boolean
	/**Whether to export the entire group */
	export: boolean
	/**Auto UV setting for the children. Can be 0, 1 or 2. */
	autouv: 0 | 1 | 2
}

declare class Group extends OutlinerNode {
	constructor(options: Partial<GroupOptions>)
	static selected: Group
	static all: Group[]

	name: string
	children: OutlinerNode[]
	reset: boolean
	shade: boolean
	selected: boolean
	visibility: boolean
	autouv: 1 | 2 | 3
	isOpen: boolean
	ik_enabled: boolean
	ik_chain_length: number

	extend: (options: Partial<GroupOptions>) => this
	selectChildren: (event: Event) => this
	selectLow: (highlight: boolean) => this
	unselect: () => this
	matchesSelection: () => boolean
	/**
	 * Opens theOpens the group and all of its ancestor groups.
	 */
	openUp: () => this
	/**
	 * Removes the group
	 * @param undo If true, an undo point will be created.
	 */
	remove: (undo?: boolean) => this
	/**
	 * Remove the group and leave all of its children in the parent array.
	 */
	resolve: () => OutlinerNode[]
	/**
	 * Move the origin of a bone to a specific location without visually affecting the position of it's content.
	 */
	transferOrigin: (origin: ArrayVector3) => this
	/**
	 * Sort the content of the group alphabetically. This will automatically create an undo point.
	 */
	sortContent: () => this
	/**
	 * Duplicate the group
	 */
	duplicate: () => Group
	getSaveCopy: () => object
	getChildlessCopy: () => Group
	compile: (undo: boolean) => object
	forEachChild(
		callback: (object: OutlinerNode) => void,
		type?: any,
		for_self?: boolean
	): void
}

interface CubeOptions {
	name: string
	autouv: 1 | 2 | 3
	shade: boolean
	mirror_uv: boolean
	inflate: number
	color: number
	visibility: boolean
	from: ArrayVector3
	to: ArrayVector3
	rotation: ArrayVector3
	origin: ArrayVector3
	/**
	 * UV position for box UV mode
	 */
	uv_offset: ArrayVector2
}

interface CubeFace {
	texture: Texture
	direction: FaceNameString
	cube: Cube
	uv: [number, number, number, number]
	rotation: number
	get uv_size(): [number, number]
	set uv_size(arr: [number, number])
	extend(data: { uv: [number, number] }): this
	reset(): this
}

declare class Cube extends OutlinerElement {
	size(axis: string | 'any', floored: boolean): [number, number, number]
	constructor(options: Partial<CubeOptions>, uuid?: string)
	autouv: 1 | 2 | 3
	shade: boolean
	mirror_uv: boolean
	inflate: number
	visibility: boolean
	from: ArrayVector3
	to: ArrayVector3
	rotation: ArrayVector3
	origin: ArrayVector3
	faces: { [index: string]: CubeFace }
	/**
	 * UV position for box UV mode
	 */
	uv_offset: ArrayVector2
	extend(options: Partial<CubeOptions>): this

	static all: Cube[]
	static selected: Cube[]
}

interface LocatorOptions {
	name: string
	from: ArrayVector3
}

declare class Locator extends OutlinerElement {
	constructor(options: Partial<LocatorOptions>, uuid?: string)

	extend(options: Partial<LocatorOptions>): this
	flip(axis: number, center: number): this
	getWorldCenter(): THREE.Vector3

	static all: Locator[]
	static selected: Locator[]
}

declare namespace Outliner {
	const root: OutlinerNode[]
	const elements: OutlinerElement[]
	const selected: OutlinerElement[]
}

declare const markerColors: {
	pastel: string
	standard: string
	name: string
}[]
