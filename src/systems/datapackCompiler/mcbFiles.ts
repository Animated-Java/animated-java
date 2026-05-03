// FIXME - Figure out how to import these files dynamically and generate the MCB_FILES object automatically.
import GLOBAL_1_20_4 from './1.20.4/global.mcb'
import GLOBAL_TEMPLATES_1_20_4 from './1.20.4/global.mcbt'
import MAIN_1_20_4 from './1.20.4/main.mcb'

import MAIN_1_20_5 from './1.20.5/main.mcb'

import GLOBAL_1_21_0 from './1.21.0/global.mcb'
import MAIN_1_21_0 from './1.21.0/main.mcb'

import MAIN_1_21_2 from './1.21.2/main.mcb'

import MAIN_1_21_4 from './1.21.4/main.mcb'

import GLOBAL_1_21_5 from './1.21.5/global.mcb'
import MAIN_1_21_5 from './1.21.5/main.mcb'

// The core is content that always goes in the `data` folder directly,
// while other files are in the `animated_java/data` folder to be overlayed when the correct version is loaded.

interface MCBFiles {
	main: string
	global: string
	globalTemplates: string
}

export function getMCBFilesByVersion(version: string): MCBFiles {
	switch (true) {
		case VersionUtil.compare(version, '>=', '1.21.11'): {
			return {
				main: MAIN_1_21_5,
				global: GLOBAL_1_21_5,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.21.9'): {
			return {
				main: MAIN_1_21_5,
				global: GLOBAL_1_21_5,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.21.6'): {
			return {
				main: MAIN_1_21_5,
				global: GLOBAL_1_21_5,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.21.5'): {
			return {
				main: MAIN_1_21_5,
				global: GLOBAL_1_21_5,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.21.4'): {
			return {
				main: MAIN_1_21_4,
				global: GLOBAL_1_21_0,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.21.2'): {
			return {
				main: MAIN_1_21_2,
				global: GLOBAL_1_21_0,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.21.0'): {
			return {
				main: MAIN_1_21_0,
				global: GLOBAL_1_21_0,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.20.5'): {
			return {
				main: MAIN_1_20_5,
				global: GLOBAL_1_20_4,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		case VersionUtil.compare(version, '>=', '1.20.4'): {
			return {
				main: MAIN_1_20_4,
				global: GLOBAL_1_20_4,
				globalTemplates: GLOBAL_TEMPLATES_1_20_4,
			}
		}

		default:
			throw new Error(`Unsupported Minecraft version: ${version}`)
	}
}
