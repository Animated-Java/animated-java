interface IGUIElement {
	type: string
}

interface IGUIElements {
	group: IGUIElement & {
		type: 'group'
		title: string
		children: GUIStructure
	}
	setting: IGUIElement & {
		type: 'setting'
		id: string
	}
}

export type AnyGUIElement = IGUIElements[keyof IGUIElements]

export type GUIStructure = AnyGUIElement[]
