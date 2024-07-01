import { TextDisplay } from '../outliner/textDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'

export function getAvailableNodes(
	excludedNodes: CollectionItem[],
	options: { groupsOnly?: boolean; excludeEmptyGroups?: boolean } = {}
): CollectionItem[] {
	const allNodes: Array<
		Group | Locator | TextDisplay | VanillaItemDisplay | VanillaBlockDisplay | OutlinerElement
	> = []
	if (options?.excludeEmptyGroups) {
		allNodes.push(
			...Group.all.filter(
				g => g.children.length > 0 && g.children.some(c => c instanceof Cube)
			)
		)
	} else {
		allNodes.push(...Group.all)
	}
	if (!options?.groupsOnly) {
		allNodes.push(
			...Locator.all,
			...TextDisplay.all,
			...VanillaItemDisplay.all,
			...VanillaBlockDisplay.all,
			...(OutlinerElement.types.camera?.all || [])
		)
	}
	const availableNodes = allNodes.map(node => {
		const entry = excludedNodes.find(n => n.value === node.uuid)
		if (entry) {
			entry.name === node.name
		}

		let icon: string
		switch (true) {
			case node instanceof Group:
				icon = 'folder'
				break
			case node instanceof Locator:
				icon = 'anchor'
				break
			case node instanceof TextDisplay:
			case node instanceof VanillaItemDisplay:
			case node instanceof VanillaBlockDisplay:
				icon = node.icon
				break
			case node instanceof OutlinerElement.types.camera:
				icon = 'videocam'
				break
			default:
				icon = 'close'
				break
		}

		return { icon, name: node.name, value: node.uuid }
	})

	return availableNodes
}
