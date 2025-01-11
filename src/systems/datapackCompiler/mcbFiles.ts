import animation_1_20_4 from './1.20.4/animation.mcb'
import static_1_20_4 from './1.20.4/static.mcb'
import core_1_20_4 from './1.20.4/core.mcb'

import animation_1_20_5 from './1.20.5/animation.mcb'
import static_1_20_5 from './1.20.5/static.mcb'

import animation_1_21_2 from './1.21.2/animation.mcb'
import static_1_21_2 from './1.21.2/static.mcb'

import animation_1_21_4 from './1.21.4/animation.mcb'
import static_1_21_4 from './1.21.4/static.mcb'

export type MinecraftVersion = '1.20.4' | '1.20.5' | '1.21.0' | '1.21.2' | '1.21.4'

// The core is content that always goes in the `data` folder directly,
// while other files are in the `animated_java/data` folder to be overlayed when the correct version is loaded.

export default {
	'1.20.4': {
		animation: animation_1_20_4,
		static: static_1_20_4,
		core: core_1_20_4,
	},
	'1.20.5': {
		animation: animation_1_20_5,
		static: static_1_20_5,
		core: core_1_20_4,
	},
	'1.21.0': {
		animation: animation_1_20_5,
		static: static_1_20_5,
		core: core_1_20_4,
	},
	'1.21.2': {
		animation: animation_1_21_2,
		static: static_1_21_2,
		core: core_1_20_4,
	},
	'1.21.4': {
		animation: animation_1_21_4,
		static: static_1_21_4,
		core: core_1_20_4,
	},
}
