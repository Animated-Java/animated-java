import { toSafeFuntionName } from '../util/minecraftUtil'
import { TextDisplay } from './textDisplay'
import { VanillaBlockDisplay } from './vanillaBlockDisplay'
import { VanillaItemDisplay } from './vanillaItemDisplay'

export function sanitizeOutlinerElementName(name: string, elementUUID: string): string {
	name = toSafeFuntionName(name)
	let otherNodes: OutlinerElement[] = [
		...VanillaBlockDisplay.all,
		...Group.all,
		...TextDisplay.all,
		...VanillaItemDisplay.all,
		...Locator.all,
	]
	if (OutlinerElement.types.camera) {
		otherNodes.push(...OutlinerElement.types.camera.all)
	}
	otherNodes = otherNodes.filter(v => v.uuid !== elementUUID)

	const otherNames = new Set(otherNodes.map(v => v.name))

	if (!otherNames.has(name)) {
		return name
	}

	let i = 1
	const match = name.match(/\d+$/)
	if (match) {
		i = parseInt(match[0])
		name = name.slice(0, -match[0].length)
	}

	let maxTries = 10000
	while (maxTries-- > 0) {
		const newName = `${name}${i}`
		if (!otherNames.has(newName)) {
			name = newName
			return newName
		}
		i++
	}

	throw new Error(`Could not make name unique for ${name} (${elementUUID})!`)
}
