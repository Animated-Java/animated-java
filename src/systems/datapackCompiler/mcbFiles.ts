import { SUPPORTED_MINECRAFT_VERSIONS } from '../global'
import animation_1_20_4 from './1.20.4/animation.mcb'
import global_1_20_4 from './1.20.4/global.mcb'
import globalTemplates_1_20_4 from './1.20.4/global.mcbt'
import static_1_20_4 from './1.20.4/static.mcb'

import animation_1_20_5 from './1.20.5/animation.mcb'
import static_1_20_5 from './1.20.5/static.mcb'

import animation_1_21_2 from './1.21.2/animation.mcb'
import static_1_21_2 from './1.21.2/static.mcb'

import animation_1_21_4 from './1.21.4/animation.mcb'
import static_1_21_4 from './1.21.4/static.mcb'

import animation_1_21_5 from './1.21.5/animation.mcb'
import static_1_21_5 from './1.21.5/static.mcb'

// The core is content that always goes in the `data` folder directly,
// while other files are in the `animated_java/data` folder to be overlayed when the correct version is loaded.

interface MCBFiles {
	animation: string
	static: string
	global: string
	globalTemplates: string
}

const MCB_FILES: Record<SUPPORTED_MINECRAFT_VERSIONS, MCBFiles> = {
	'1.21.9': {
		animation: animation_1_21_5,
		static: static_1_21_5,
		global: global_1_20_4,
		globalTemplates: globalTemplates_1_20_4,
	},
	'1.21.5': {
		animation: animation_1_21_5,
		static: static_1_21_5,
		global: global_1_20_4,
		globalTemplates: globalTemplates_1_20_4,
	},
	'1.21.4': {
		animation: animation_1_21_4,
		static: static_1_21_4,
		global: global_1_20_4,
		globalTemplates: globalTemplates_1_20_4,
	},
	'1.21.2': {
		animation: animation_1_21_2,
		static: static_1_21_2,
		global: global_1_20_4,
		globalTemplates: globalTemplates_1_20_4,
	},
	'1.21.0': {
		animation: animation_1_20_5,
		static: static_1_20_5,
		global: global_1_20_4,
		globalTemplates: globalTemplates_1_20_4,
	},
	'1.20.5': {
		animation: animation_1_20_5,
		static: static_1_20_5,
		global: global_1_20_4,
		globalTemplates: globalTemplates_1_20_4,
	},
	'1.20.4': {
		animation: animation_1_20_4,
		static: static_1_20_4,
		global: global_1_20_4,
		globalTemplates: globalTemplates_1_20_4,
	},
}

export default MCB_FILES
