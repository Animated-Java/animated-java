import { BlockDisplay } from '../blockbench-additions/outliner-elements/blockDisplay'
import { ItemDisplay } from '../blockbench-additions/outliner-elements/itemDisplay'
import { TextDisplay } from '../blockbench-additions/outliner-elements/textDisplay'

export function getAvailableNodes(
	excludedNodes: CollectionItem[],
	options: { groupsOnly?: boolean; excludeEmptyGroups?: boolean } = {}
): CollectionItem[] {
	const allNodes: Array<
		Group | Locator | TextDisplay | ItemDisplay | BlockDisplay | OutlinerElement
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
			...ItemDisplay.all,
			...BlockDisplay.all,
			...(OutlinerElement.types.camera?.all || [])
		)
	}
	const availableNodes = allNodes.map(node => {
		const entry = excludedNodes.find(n => n.value === node.uuid)
		if (entry) {
			entry.name = node.name
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
			case node instanceof ItemDisplay:
			case node instanceof BlockDisplay:
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
