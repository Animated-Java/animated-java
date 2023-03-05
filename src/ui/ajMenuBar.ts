import { exportProject } from '../exporter'
import { ajModelFormat } from '../modelFormat'
import { createAction } from '../util/moddingTools'
import { translate } from '../util/translation'
import { openAjDocsDialog } from './ajDocs'
import { openAjProjectSettingsDialog } from './ajProjectSettings'
import { openAjSettingsDialog } from './ajSettings'

MenuBar.addAction(
	createAction('animated_java:settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.settings'),
		condition: () => Format === ajModelFormat,
		click() {
			openAjSettingsDialog()
		},
	}),
	'animated_java:menu'
)

MenuBar.addAction(
	createAction('animated_java:project_settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.project_settings'),
		condition: () => Format === ajModelFormat,
		click: function () {
			openAjProjectSettingsDialog()
		},
	}),
	'animated_java:menu'
)

MenuBar.addAction(
	createAction('animated_java:documentation', {
		icon: 'find_in_page',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.documentation'),
		condition: () => Format === ajModelFormat,
		click: function () {
			openAjDocsDialog()
		},
	}),
	'animated_java:menu'
)

MenuBar.addAction(
	createAction('animated_java:export_project', {
		name: translate('animated_java.menubar.items.export_project'),
		icon: 'insert_drive_file',
		category: 'file',
		condition: () => Format === ajModelFormat,
		click: () => {
			void exportProject().catch(e => {
				console.error(e)
			})
		},
	}),
	'animated_java:menu'
)
