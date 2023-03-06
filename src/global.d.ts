import type { AnimatedJavaExporter } from './exporter'
import type { IAnimatedJavaProjectSettings } from './projectSettings'
import type { Setting } from './settings'
import type { translate } from './util/translation'
import type { VariantsContainer } from './variants'
import {
	NbtByte,
	NbtByteArray,
	NbtCompound,
	NbtDouble,
	NbtFloat,
	NbtInt,
	NbtIntArray,
	NbtList,
	NbtLong,
	NbtLongArray,
	NbtString,
	NbtFile,
} from 'deepslate'

type ProjectSettings = Record<string, Setting<any>>

declare global {
	interface Cube {
		forceVisible?: boolean
		_forceVisible?: boolean
	}

	interface ModelProject {
		animated_java_settings?: IAnimatedJavaProjectSettings
		animated_java_exporter_settings?: Record<string, ProjectSettings>
		animated_java_variants?: VariantsContainer
	}
	const AnimatedJava: {
		Exporter: typeof AnimatedJavaExporter
		settings: Record<string, Setting<unknown>>
		Settings: typeof import('./settings')
		events: typeof import('./util/events')
		translate: typeof translate
		formatStr: typeof import('./util/misc').formatStr
		docClick: (link: string) => void
		openAjDocsDialog: (link: string) => void
		VirtualFileSystem: typeof import('./util/virtualFileSystem')
		deepslate: {
			NbtByte: typeof NbtByte
			NbtByteArray: typeof NbtByteArray
			NbtCompound: typeof NbtCompound
			NbtDouble: typeof NbtDouble
			NbtFloat: typeof NbtFloat
			NbtInt: typeof NbtInt
			NbtIntArray: typeof NbtIntArray
			NbtList: typeof NbtList
			NbtLong: typeof NbtLong
			NbtLongArray: typeof NbtLongArray
			NbtString: typeof NbtString
			NbtFile: typeof NbtFile
		}
	}
}
