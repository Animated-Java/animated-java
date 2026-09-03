import { Interaction } from '../outliner/interaction'
import { TextDisplay } from '../outliner/textDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
import { getAnimatableNodes } from '../systems/animationRenderer'

export function toCollectionItems(nodes: string[]): CollectionItem[] {
	return (
		getAnimatableNodes()
			.filter(node => nodes.includes(node.uuid))
			// @ts-expect-error - node.icon missing type
			.map(node => ({ name: node.name, icon: node.icon, value: node.uuid }))
	)
}

export function fromCollectionItems(items: CollectionItem[]): string[] {
	return items.map(item => item.value)
}

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
			...Interaction.all,
			...VanillaItemDisplay.all,
			...VanillaBlockDisplay.all,
			// @ts-expect-error - Broken BB types
			...(OutlinerElement.types.camera?.all ?? [])
		)
	}
	const availableNodes = allNodes.map(node => {
		const entry = excludedNodes.find(n => n.value === node.uuid)
		if (entry) {
			entry.name = node.name
		}

		// @ts-expect-error - Broken BB types
		return { icon: node.icon, name: node.name, value: node.uuid }
	})

	return availableNodes
}
