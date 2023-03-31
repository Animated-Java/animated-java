import { SettingID } from './settings'

interface IGUIElement {
	type: string
}

interface IGUIElements {
	group: IGUIElement & {
		type: 'group'
		openByDefault: boolean
		title: string
		children: GUIStructure
	}
	setting: IGUIElement & {
		type: 'setting'
		settingId: SettingID
	}
	toggle: {
		type: 'toggle'
		settingId: SettingID
		title?: string
		activeTitle?: string
		inactiveTitle?: string
		active: GUIStructure
		inactive: GUIStructure
	}
}

export type AnyGUIElement = IGUIElements[keyof IGUIElements]

export type GUIStructure = AnyGUIElement[]
