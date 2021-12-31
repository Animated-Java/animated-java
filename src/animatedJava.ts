import events from './constants/events'
import { BuildModel } from './mainEntry'
import { settings } from './settings'
import { store } from './util/store'
import { bus } from './util/bus'
import { format } from './modelFormat'
import { registerSettingRenderer } from './ui/dialogs/settings'
import './ui/mods/boneConfig'
import './compileLangMC'
const ANIMATED_JAVA = {
	build(callback: Function, configuration: Record<any, any>) {
		const default_configuration = {
			generate_static_animation: false,
		}
		BuildModel(
			callback,
			Object.assign(default_configuration, configuration)
		)
	},
	registerExportFunc(name: string, exportFunc: () => void) {
		store.getStore('exporters').set(name, exportFunc)
	},
	settings,
	store: store,
	format: format,
	registerSettingRenderer,
	logging: false, //enable logging in production
	PromiseWrapper<T>(promise: Promise<T>): Promise<T> {
		return promise.catch((e) => {
			ANIMATED_JAVA.asyncError(e)
			return e
		})
	},
	asyncError(e: Error) {
		console.error('CUSTOM ERROR HANDLING', e)
	},
	logIntlDifferences(showDefaultValues: boolean) {
		intl.diff(showDefaultValues)
	},
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

import './exporters/statueExporter'
import './exporters/animationExporter'
import { intl } from './util/intl'
// @ts-ignore
Blockbench.dispatchEvent('animated-java-ready', ANIMATED_JAVA)
// @ts-ignore
Blockbench.events['animated-java-ready'].length = 0

// WOOO TYPING, YAAAAAAY

export interface Settings {
	animatedJava: {
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
	[index: string]: any
}

export type Bone = {
	nbt: string
	armAnimationEnabled: boolean
	customModelData: number
	exported: boolean
} & Cube

export interface BoneObject {
	[index: string]: Bone
}

export type AnimationFrameBone = {
	exported: boolean
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

export type VariantModel = {
	aj: {
		customModelData: number
	}
	parent: string
	textures: TextureObject
}

export interface VariantModels {
	[index: string]: {
		[index: string]: VariantModel
	}
}

export interface VariantTextureOverrides {
	[index: string]: {
		[index: string]: {
			textures: TextureObject
		}
	}
}

export interface variantTouchedModels {
	[index: string]: Model
}
