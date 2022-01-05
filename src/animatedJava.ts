import events from './constants/events'
import { BuildModel } from './mainEntry'
import { settings } from './settings'
import { store } from './util/store'
import { bus } from './util/bus'
import './bbmods/patchAction'
import { format as modelFormat } from './modelFormat'
import { tl } from './util/intl'
import { registerSettingRenderer } from './ui/dialogs/settings'
import './ui/mods/boneConfig'
import './compileLangMC'
import './exporters/statueExporter'
import './exporters/animationExporter'
import './bbmods/modelFormatMod'
import { intl } from './util/intl'
import { CustomError } from './util/customError'
import { format } from './util/replace'

function showUnknownErrorDialog(e: CustomError | any) {
	// console.log(e.options)
	if (e.options?.silent) {
		console.log(e.options.message)
		return
	}
	new Dialog(
		Object.assign(
			{
				id: 'animatedJava.dialog.miscError',
				title: tl('animatedJava.dialog.miscError.title'),
				lines: [
					format(tl('animatedJava.dialog.miscError.body'), {
						buildID: process.env.BUILD_ID,
						errorMessage: e.options ? e.options.message : e.message,
						errorStack: e.stack,
						discordLink: process.env.DISCORD_LINK,
						githubLink: process.env.GITHUB_ISSUES_LINK,
					}),
				],
				width: 1024,
				height: 512,
				singleButton: true,
			},
			e.options?.dialog || {}
		)
	).show()
}

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
	format: modelFormat,
	registerSettingRenderer,
	get variants() {
		return store.get('states')
	},
	logging: false, //enable logging in production
	PromiseWrapper<T>(promise: Promise<T>): Promise<T> {
		return promise.catch((e) => {
			ANIMATED_JAVA.asyncError(e)
			return e
		})
	},
	asyncError(e: Error) {
		showUnknownErrorDialog(e)
		throw e
		// console.error('CUSTOM ERROR HANDLING', e)
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
