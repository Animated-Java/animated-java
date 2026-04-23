import { join } from 'node:path'
import { SvelteDialogSidebar } from 'svelte-patching-tools/blockbench'
import { fs } from '../../constants'
import { updateRotationConstraints } from '../../formats/blueprint'
import {
	EXPORT,
	EXPORT_DEBUG,
	OPEN_ABOUT,
	OPEN_DOCUMENTATION,
} from '../../interface/animatedJavaBarItem'
import { updateAllCubeOutlines } from '../../mods/cube'
import type { ValueCheckResult } from '../../svelteComponents/sidebarDialogItems/sidebarDialogTypes'
import { getVersionById } from '../../systems/minecraft/versionManager'
import { resolvePath } from '../../util/fileUtil'
import { parseResourceLocation } from '../../util/minecraftUtil'
import Footer from './footer.svelte'
import Datapack from './pages/datapack.svelte'
import General from './pages/general.svelte'
import Misc from './pages/misc.svelte'
import Resourcepack from './pages/resourcepack.svelte'

export function openBlueprintSettingsv2() {
	new SvelteDialogSidebar({
		id: `animated_java_blueprint_settings`,
		title: 'Blueprint Settings',
		pages: {
			general: {
				component: General,
				label: 'General',
				icon: 'settings',
			},
			datapack: {
				component: Datapack,
				label: 'Data Pack',
				icon: 'database',
			},
			resourcepack: {
				component: Resourcepack,
				label: 'Resource Pack',
				icon: 'image',
			},
			misc: {
				component: Misc,
				label: 'Misc',
				icon: 'tune',
			},
		},
		footer: {
			component: Footer,
		},
		pageSwitchActions: [
			OPEN_DOCUMENTATION.get()!,
			OPEN_ABOUT.get()!,
			EXPORT_DEBUG.get()!,
			EXPORT.get()!,
		],
		width: 1024,
		defaultPage: 'general',
		disableKeybinds: true,
		buttons: ['Close'],
		onClose: () => {
			updateRotationConstraints()
			updateAllCubeOutlines()
			Canvas.updateAll()
		},
	}).show()
}

export function validateBlueprintId(value: string): ValueCheckResult {
	const parsed = parseResourceLocation(value)

	if (parsed.namespace === 'minecraft') {
		return {
			type: 'error',
			message: 'The `minecraft` namespace is reserved and cannot be used.',
		}
	}

	if (parsed.path === '') {
		return {
			type: 'error',
			message: 'Namespace path cannot be empty.',
		}
	}

	if (parsed.namespace === 'animated_java' && parsed.path === 'global') {
		return {
			type: 'error',
			message: '`animated_java:global` is a reserved ID and cannot be used.',
		}
	}

	if (/[^a-z0-9_]/.exec(parsed.namespace) || /[^a-z0-9_\/]/.exec(parsed.path)) {
		return {
			type: 'error',
			message: 'Blueprint ID can only contain lowercase letters, numbers, and underscores.',
		}
	}
}

export function validateTextureSize(valueX: number, valueY: number): ValueCheckResult {
	const largestWidth = Texture.all.reduce((largest, t) => Math.max(largest, t.width), 0)
	const largestHeight = Texture.all.reduce(
		(largest, t) => Math.max(largest, t.frameCount ? t.width : t.height),
		0
	)

	if (valueX !== largestWidth) {
		return {
			type: 'warning',
			message: `Texture width does not match the width of the largest texture (${largestWidth}). This may cause rendering issues.`,
		}
	}

	if (valueY !== largestHeight) {
		return {
			type: 'warning',
			message: `Texture height does not match the height of the largest texture (${largestHeight}). This may cause rendering issues.`,
		}
	}

	if (valueX !== valueY) {
		return {
			type: 'warning',
			message: 'Texture width and height are not the same. This may cause rendering issues.',
		}
	}

	// Both values are identical at this point, so we only need to check one of them for being a power of two
	if (valueX !== 2 ** Math.floor(Math.log2(valueX))) {
		return {
			type: 'warning',
			message: 'Texture size is not a power of two. This may cause rendering issues.',
		}
	}
}

export async function validateTargetMinecraftVersion(value: string): Promise<ValueCheckResult> {
	try {
		VersionUtil.parse(value)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error: any) {
		return {
			type: 'error',
			message: 'Invalid Minecraft version format.',
		}
	}

	if (VersionUtil.compare(value, '<', '1.20.4')) {
		return {
			type: 'error',
			message: `Versions below 1.20.4 are not supported.`,
		}
	}

	try {
		await getVersionById(value)
	} catch (error: any) {
		return {
			type: 'error',
			message: error.message,
		}
	}
}

export function validateResourcePackFolder(value: string): ValueCheckResult {
	if (value === '') {
		return {
			type: 'error',
			message: 'Resource pack folder is required.',
		}
	}

	let path: string
	try {
		path = resolvePath(value)
	} catch (error: any) {
		console.error(error)
		return {
			type: 'error',
			message: `Failed to resolve path: ${error.message}`,
		}
	}

	if (!fs.existsSync(path)) {
		return {
			type: 'error',
			message: 'Selected path does not exist.',
		}
	}

	if (!fs.statSync(path).isDirectory()) {
		return {
			type: 'error',
			message: 'Selected path is not a directory.',
		}
	}

	if (!fs.existsSync(join(path, 'pack.mcmeta'))) {
		return {
			type: 'error',
			message: 'Selected folder does not contain a pack.mcmeta file.',
		}
	}

	if (!fs.existsSync(join(path, 'assets'))) {
		return {
			type: 'warning',
			message: 'Selected folder does not contain an assets folder.',
		}
	}
}

export function validateDataPackFolder(value: string): ValueCheckResult {
	if (value === '') {
		return {
			type: 'error',
			message: 'Data pack folder is required.',
		}
	}

	let path: string
	try {
		path = resolvePath(value)
	} catch (error: any) {
		console.error(error)
		return {
			type: 'error',
			message: `Failed to resolve path: ${error.message}`,
		}
	}

	if (!fs.existsSync(path)) {
		return {
			type: 'error',
			message: 'Selected path does not exist.',
		}
	}

	if (!fs.statSync(path).isDirectory()) {
		return {
			type: 'error',
			message: 'Selected path is not a directory.',
		}
	}

	if (!fs.existsSync(join(path, 'pack.mcmeta'))) {
		return {
			type: 'error',
			message: 'Selected folder does not contain a pack.mcmeta file.',
		}
	}

	if (!fs.existsSync(join(path, 'data'))) {
		return {
			type: 'warning',
			message: 'Selected folder does not contain a data folder.',
		}
	}
}

export function validateZipPath(value: string): ValueCheckResult {
	if (value === '') {
		return {
			type: 'error',
			message: 'Value cannot be empty.',
		}
	}

	let path: string
	try {
		path = resolvePath(value)
	} catch (error: any) {
		console.error(error)
		return {
			type: 'error',
			message: `Failed to resolve path: ${error.message}`,
		}
	}

	if (!/\.zip$/i.test(path)) {
		return {
			type: 'error',
			message: 'Selected file must end with .zip extension.',
		}
	}
}
