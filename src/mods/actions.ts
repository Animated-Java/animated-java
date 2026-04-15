import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { fs } from '../constants'
import { openBlueprintSettingsDialog } from '../dialogs/blueprintSettings/blueprintSettings'
import { activeProjectIsBlueprintFormat, saveBlueprint } from '../formats/blueprint'
import { BLUEPRINT_CODEC } from '../formats/blueprint/codec'

registerPropertyOverridePatch({
	id: `animated_java:action-click-override/save-project`,
	target: BarItems.save_project as Action,
	key: 'click',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => saveBlueprint,
})

registerPropertyOverridePatch({
	id: `animated_java:action-click-override/save-project-as`,
	target: BarItems.save_project_as as Action,
	key: 'click',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => {
		return () => {
			const codec = BLUEPRINT_CODEC.get()
			if (!codec) throw new Error('Blueprint codec not registered')
			codec.export()
		}
	},
})

registerPropertyOverridePatch({
	id: `animated_java:action-click-override/project-window`,
	target: BarItems.project_window as Action,
	key: 'click',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => {
		return openBlueprintSettingsDialog
	},
})

registerPropertyOverridePatch({
	id: `animated_java:action-click-override/export-project`,
	target: BarItems.export_over as Action,
	key: 'click',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => {
		return () => {
			if (!Project || !Format) return

			const codec = BLUEPRINT_CODEC.get()!
			if (!codec) throw new Error('Blueprint codec not registered')

			const path = Project.save_path || Project.export_path
			if (path) {
				if (fs.existsSync(PathModule.dirname(path))) {
					Project.save_path = path
					codec.write(codec.compile(), path)
				} else {
					console.error(
						`Failed to export Animated Java Blueprint, file location '${path}' does not exist!`
					)
					codec.export()
				}
			} else {
				codec.export()
			}
		}
	},
})
