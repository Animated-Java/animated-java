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
import './compileLangMC'
import './exporters/vanillaStatue'
import './exporters/vanillaAnimation'
import './exporters/rawAnimation'
import './bbmods/modelFormatMod'
import './bbmods/faceTint'
import './util/minecraft/registryLoader'
import './util/minecraft/entities'
import './util/minecraft/items'
import { intl } from './util/intl'
import { CustomError } from './util/customError'
import * as nbt from './util/SNBT'

const errorMessages = [
	'Uh oh!',
	"Time to fire up the ol' debugger!",
	'Your armor stands are sad :(',
	'Ok, who pushed the big red button?',
]

function getRandomErrorMessage() {
	const index = Math.round(Math.random() * (errorMessages.length - 1))
	return errorMessages[index]
}

function showUnknownErrorDialog(e: CustomError | any) {
	// console.log(e.options)
	if (e.options?.silent) {
		console.log(e.options.message)
		return
	}
	new Dialog(
		Object.assign(
			{
				id: 'animatedJava.dialogs.miscError',
				title: tl('animatedJava.dialogs.errors.misc.title'),
				lines: [
					tl(
						'animatedJava.dialogs.errors.misc.body',
						{
							buildID: process.env.BUILD_ID,
							errorMessage: e.options
								? e.options.message
								: e.message,
							randomErrorMessage: getRandomErrorMessage(),
							errorStack: e.stack,
							discordLink: process.env.DISCORD_LINK,
							githubLink: process.env.GITHUB_ISSUES_LINK,
						},
						true
					),
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
	SNBT: nbt.SNBT,
	settings,
	store: store,
	format: modelFormat,
	registerSettingRenderer,
	exportInProgress: false,
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
		ANIMATED_JAVA.exportInProgress = false
		throw e
		// console.error('CUSTOM ERROR HANDLING', e)
	},
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
	error?: string
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
	verbose: boolean
}

export interface ExportData {
	settings: GlobalSettings
	cubeData: CubeData
	bones: BoneObject
	models: ModelObject
	variantTextureOverrides: VariantTextureOverrides
	variantModels: VariantModels
	variantTouchedModels: variantTouchedModels
	animations: Animations
	scaleModels: ScaleModels
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
		translation: Vector3,
		rotation: Vector3,
		scale: Vector3,
	},
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
