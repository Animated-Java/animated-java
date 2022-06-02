import events from './constants/events'
import { BuildModel } from './mainEntry'
import { store } from './util/store'
import { bus } from './util/bus'
import './bbmods/patchAction'
import { format as modelFormat } from './modelFormat'
import { tl } from './util/intl'
import { settings } from './settings'
import { registerSettingRenderer } from './ui/dialogs/settings'
import './ui/mods/boneConfig'
import './ui/variants'
import './compileLangMC'
// import './exporters/vanillaStatue'
// import './exporters/vanillaAnimation'
// import './exporters/rawAnimation'
import './exporters/vanillaAnimation/entry'
import './bbmods/modelFormatMod'
import './bbmods/addAnimation'
import './bbmods/faceTint'
import './bbmods/animator20fps'
import './util/minecraft/registryLoader'
import './util/minecraft/entities'
import './util/minecraft/items'
import { intl } from './util/intl'
import { CustomError } from './util/customError'
import * as nbt from './util/SNBT'
// import * as EVENTS from './constants/events'
import type { Variant } from './variants'

const ANIMATED_JAVA = {
	build(callback: Function, configuration: Record<any, any>) {
		const default_configuration = {
			generate_static_animation: false,
		}
		BuildModel(callback, Object.assign(default_configuration, configuration))
	},
	registerExportFunc(name: string, exportFunc: () => void) {
		store.getStore('exporters').set(name, exportFunc)
	},
	SNBT: nbt.SNBT,
	settings,
	store: store,
	format: modelFormat,
	registerSettingRenderer,
	exportInProgress: false,
	get variants() {
		return store.get('variants')
	},
	logging: false, //enable logging in production
	// PromiseWrapper<T>(promise: Promise<T>): Promise<T> {
	// 	return promise.catch((e) => {
	// 		ANIMATED_JAVA.asyncError(e)
	// 		return e
	// 	})
	// },
	// asyncError(e: Error) {
	// 	showUnknownErrorDialog(e)
	// 	ANIMATED_JAVA.exportInProgress = false
	// 	throw e
	// 	// console.error('CUSTOM ERROR HANDLING', e)
	// },
	logIntlDifferences(showDefaultValues: boolean) {
		intl.diff(showDefaultValues)
	},
	intl,
	tl,
}
delete window['ANIMATED_JAVA']
// Object.defineProperty(window., 'ANIMATED_JAVA', {
// 	value: ANIMATED_JAVA,
// })
// @ts-ignore
window.ANIMATED_JAVA = ANIMATED_JAVA
bus.on(events.LIFECYCLE.CLEANUP, () => {
	console.log('CLEANUP')
	// @ts-ignore
	delete window.ANIMATED_JAVA
})

// @ts-ignore
Blockbench.dispatchEvent('animated-java-ready', ANIMATED_JAVA)
// @ts-ignore
Blockbench.events['animated-java-ready'].length = 0

// WOOO TYPING, YAAAAAAY

export interface SettingDescriptor {
	readonly value: any
	errors?: string | string[]
	warnings?: string[]
	isValid?: boolean
	setting: any
	event: 'get' | 'set' | 'update' | 'dummy'
}

export interface Settings {
	projectName: string
	exporter: string
	useCache: boolean
	cacheMode: 'memory' | 'disk'
	rigItem: string
	predicateFilePath: string
	rigModelsExportFolder: string
	transparentTexturePath: string
	boundingBoxRenderMode: 'single' | 'multiple' | 'disabled'
}

export interface ExportData {
	settings: GlobalSettings
	cubeData: CubeData
	bones: BoneObject
	models: ModelObject
	variants: Variant[]
	animations: Animations
	scaleModels: ScaleModels
}

interface ExporterSetting {
	title: string
	description: string
	type: string
	default: any
	onUpdate: (d: SettingDescriptor) => SettingDescriptor
	isVisible?: (settings: GlobalSettings) => boolean
	dependencies?: string[]
	groupName?: string
	group?: string
}

interface CheckboxExporterSetting extends ExporterSetting {
	type: 'checkbox'
	default: boolean
	onUpdate: (d: SettingDescriptor & { value: boolean }) => SettingDescriptor
}

interface TextExporterSetting extends ExporterSetting {
	type: 'text'
	default: string
	onUpdate: (d: SettingDescriptor & { value: string }) => SettingDescriptor
}

interface NumberExporterSetting extends ExporterSetting {
	type: 'number'
	default: number
	onUpdate: (d: SettingDescriptor & { value: number }) => SettingDescriptor
}

interface SelectExporterSetting<T extends { [key: string | number]: any }> extends ExporterSetting {
	type: 'select'
	options: T
	default: keyof T
	onUpdate: (d: SettingDescriptor & { value: T }) => SettingDescriptor
}

interface FilepathExporterSetting extends ExporterSetting {
	type: 'filepath'
	default: string
	props: {
		target: 'file' | 'folder'
		dialogOpts: {
			defaultPath?: string
			promptToCreate?: boolean
			properties?: any[]
		}
	}
	onUpdate: (d: SettingDescriptor & { value: string }) => SettingDescriptor
}

export interface ExporterOptions {
	settings: {
		[key: string]:
			| CheckboxExporterSetting
			| TextExporterSetting
			| NumberExporterSetting
			| FilepathExporterSetting
			| SelectExporterSetting<any>
	}
}

export interface GlobalSettings {
	animatedJava: Settings
	[index: string]: any
}

export type Bone = {
	nbt: string
	armAnimationEnabled: boolean
	customModelData: number
	export: boolean
} & Cube

export interface BoneObject {
	[index: string]: Bone
}

export type AnimationFrameBone = {
	export: boolean
	pos: { x: number; y: number; z: number }
	rot: { x: number; y: number; z: number }
	scale: { x: number; y: number; z: number }
}

export type Frame = {
	bones: AnimationFrameBone[]
	scripts: any
}

export type RenderedAnimation = {
	frames: Frame[]
	maxDistance: number
	name: string
	loopMode: 'loop' | 'hold' | 'once'
}

export interface Animations {
	[index: string]: RenderedAnimation
}

export type ModelFace = {
	texture: `#${number}`
	uv: [number, number, number, number]
}

export type ModelElement = {
	faces: {
		north?: ModelFace
		south?: ModelFace
		east?: ModelFace
		west?: ModelFace
		up?: ModelFace
		down?: ModelFace
	}
	rotation: {
		angle: number
		axis: 'x' | 'y' | 'z'
		origin: [number, number, number]
	}
	to: [number, number, number]
	from: [number, number, number]
	uuid?: string
}

export type TextureObject = {
	[index: number]: string
	[index: `${number}`]: string
}

export type Model = {
	aj: {
		customModelData: number
	}
	parent: string
	display: any
	elements: ModelElement[]
	textures: TextureObject
}

export interface ModelObject {
	[index: string]: Model
}

export interface CubeData {
	clear_elements: ModelElement[]
	element_index_lut: number[]
	invalid_rot_elements: Bone[]
	textures_used: Texture[]
}

type Vector3 = [number, number, number]

export type ModelDisplay = {
	head: {
		translation: Vector3
		rotation: Vector3
		scale: Vector3
	}
}

export type ScaleModel = {
	aj: {
		customModelData: number
	}
	parent: string
	display: ModelDisplay
}

export interface ScaleModels {
	[index: string]: {
		[index: string]: ScaleModel
	}
}
