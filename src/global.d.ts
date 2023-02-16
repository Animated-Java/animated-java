import { SettingObject } from './settings'

declare global {
	interface ModelProject {
		animated_java_settings?: SettingObject
	}
}
