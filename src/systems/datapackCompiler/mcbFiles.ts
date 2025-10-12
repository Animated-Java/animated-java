import { SUPPORTED_MINECRAFT_VERSIONS } from '../global'
// FIXME - Figure out how to import these files dynamically and generate the MCB_FILES object automatically.
import ANIMATION_1_20_4 from './1.20.4/animation.mcb'
import GLOBAL_1_20_4 from './1.20.4/global.mcb'
import GLOBAL_TEMPLATES_1_20_4 from './1.20.4/global.mcbt'
import STATIC_1_20_4 from './1.20.4/static.mcb'

import ANIMATION_1_20_5 from './1.20.5/animation.mcb'
import STATIC_1_20_5 from './1.20.5/static.mcb'

import ANIMATION_1_21_2 from './1.21.2/animation.mcb'
import GLOBAL_1_21_2 from './1.21.2/global.mcb'
import STATIC_1_21_2 from './1.21.2/static.mcb'

import ANIMATION_1_21_4 from './1.21.4/animation.mcb'
import STATIC_1_21_4 from './1.21.4/static.mcb'

import GLOBAL_1_21_5 from './1.21.5/global.mcb'

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
		animation: ANIMATION_1_21_4,
		static: STATIC_1_21_4,
		global: GLOBAL_1_21_5,
		globalTemplates: GLOBAL_TEMPLATES_1_20_4,
	},
	'1.21.5': {
		animation: ANIMATION_1_21_4,
		static: STATIC_1_21_4,
		global: GLOBAL_1_21_5,
		globalTemplates: GLOBAL_TEMPLATES_1_20_4,
	},
	'1.21.4': {
		animation: ANIMATION_1_21_4,
		static: STATIC_1_21_4,
		global: GLOBAL_1_21_2,
		globalTemplates: GLOBAL_TEMPLATES_1_20_4,
	},
	'1.21.2': {
		animation: ANIMATION_1_21_2,
		static: STATIC_1_21_2,
		global: GLOBAL_1_21_2,
		globalTemplates: GLOBAL_TEMPLATES_1_20_4,
	},
	'1.20.5': {
		animation: ANIMATION_1_20_5,
		static: STATIC_1_20_5,
		global: GLOBAL_1_20_4,
		globalTemplates: GLOBAL_TEMPLATES_1_20_4,
	},
	'1.20.4': {
		animation: ANIMATION_1_20_4,
		static: STATIC_1_20_4,
		global: GLOBAL_1_20_4,
		globalTemplates: GLOBAL_TEMPLATES_1_20_4,
	},
}

export default MCB_FILES
