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
	toggle: {
		type: 'toggle'
		title?: string
		activeTitle?: string
		inactiveTitle?: string
		active: GUIStructure
		inactive: GUIStructure
	}
}

export type AnyGUIElement = IGUIElements[keyof IGUIElements]

export type GUIStructure = AnyGUIElement[]
