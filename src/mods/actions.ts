import { BLUEPRINT_CODEC } from 'src/formats/blueprint/codec'
import { openBlueprintSettingsDialog } from 'src/interface/dialog/blueprintSettings'
import { activeProjectIsBlueprintFormat, saveBlueprint } from '../formats/blueprint/format'
import { registerConditionalPropertyOverrideMod } from '../util/moddingTools'

registerConditionalPropertyOverrideMod({
	id: `animated-java:action-click-override/save-project`,
	object: BarItems.save_project as Action,
	key: 'click',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),

		override: () => saveBlueprint,
	},
})

registerConditionalPropertyOverrideMod({
	id: `animated-java:action-click-override/save-project-as`,
	object: BarItems.save_project_as as Action,
	key: 'click',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),

		override: () => {
			return () => {
				const codec = BLUEPRINT_CODEC.get()
				if (!codec) throw new Error('Blueprint codec not registered')
				codec.export()
			}
		},
	},
})

registerConditionalPropertyOverrideMod({
	id: `animated-java:action-click-override/project-window`,
	object: BarItems.project_window as Action,
	key: 'click',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),

		override: () => {
			return openBlueprintSettingsDialog
		},
	},
})

registerConditionalPropertyOverrideMod({
	id: `animated-java:action-click-override/export-project`,
	object: BarItems.export_over as Action,
	key: 'click',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),
		override: () => {
			return (event: Event) => {
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
	},
})
