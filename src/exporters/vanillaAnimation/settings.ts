import type * as aj from '../../animatedJava'
import { Entities } from '../../util/minecraft/entities'
import { SNBT } from '../../util/SNBT'
import { tl } from '../../util/intl'
import * as pathjs from 'path'
import { format } from '../../util/replace'

const emptySettingError = tl('vanillaAnimation.settings.generic.errors.emptyValue')

export interface ExporterSettings {
	rootEntity: string
	rootEntityNbt: string
	defaultToMarker: boolean
	exportFormat: 'vanilla' | 'mcbuild'
	mcFilePath: string
	datapackPath: string

	exportMethod: 'bakedScoreboardTree' | 'dynamicScoreboardMath'
	selectionMethod: 'scoreboardId' | 'uuid'
	calculateMaximumDistance: boolean
	maximumDistanceSafezone: number
	manualMaximumDistance: number
}

const advanced_settings: aj.ExporterOptions['settings'] = {
	exportMethod: {
		title: tl(`vanillaAnimation.settings.exportMethod.title`),
		description: tl(`vanillaAnimation.settings.exportMethod.description`),
		type: 'select',
		options: {
			bakedScoreboardTree: tl(
				`vanillaAnimation.settings.exportMethod.options.bakedScoreboardTree`
			),
			dynamicScoreboardMath: tl(
				`vanillaAnimation.settings.exportMethod.options.dynamicScoreboardMath`
			),
		},
		default: 'bakedScoreboardTree',
		onUpdate(d) {
			return d
		},
		groupName: 'vanillaAnimation.settings.groups.advanced.title',
		group: 'advanced',
	},

	selectionMethod: {
		title: tl(`vanillaAnimation.settings.selectionMethod.title`),
		description: tl(`vanillaAnimation.settings.selectionMethod.description`),
		type: 'select',
		options: {
			scoreboardId: tl(`vanillaAnimation.settings.selectionMethod.options.scoreboardId`),
			uuid: tl(`vanillaAnimation.settings.selectionMethod.options.uuid`),
		},
		default: 'scoreboardId',
		onUpdate(d) {
			return d
		},
		groupName: 'vanillaAnimation.settings.groups.advanced.title',
		group: 'advanced',
	},

	calculateMaximumDistance: {
		title: tl(`vanillaAnimation.settings.calculateMaximumDistance.title`),
		description: tl(`vanillaAnimation.settings.calculateMaximumDistance.description`),
		type: 'checkbox',
		default: true,
		onUpdate(d) {
			return d
		},
		group: 'advanced',
	},

	maximumDistanceSafezone: {
		title: tl(`vanillaAnimation.settings.maximumDistanceSafezone.title`),
		description: tl(`vanillaAnimation.settings.maximumDistanceSafezone.description`),
		type: 'number',
		default: 1,
		onUpdate(d) {
			if (d.value > 50) {
				d.isValid = false
				d.warnings.push(
					tl('vanillaAnimation.settings.maximumDistanceSafezone.warnings.largeDistance')
				)
			} else if (d.value <= 0) {
				d.isValid = false
				d.errors = tl(
					'vanillaAnimation.settings.maximumDistanceSafezone.errors.minimumValue'
				)
			}
			return d
		},
		isVisible(s) {
			return s.vanillaAnimation.calculateMaximumDistance
		},
		dependencies: ['vanillaAnimation.calculateMaximumDistance'],
		group: 'advanced',
	},

	manualMaximumDistance: {
		title: tl(`vanillaAnimation.settings.manualMaximumDistance.title`),
		description: tl(`vanillaAnimation.settings.manualMaximumDistance.description`),
		type: 'number',
		default: 1,
		onUpdate(d) {
			if (d.value > 50) {
				d.isValid = false
				d.warnings.push(
					tl('vanillaAnimation.settings.manualMaximumDistance.warnings.largeDistance')
				)
			} else if (d.value <= 0) {
				d.isValid = false
				d.errors = tl('vanillaAnimation.settings.manualMaximumDistance.errors.minimumValue')
			}
			return d
		},
		isVisible(s) {
			return !s.vanillaAnimation.calculateMaximumDistance
		},
		dependencies: ['vanillaAnimation.calculateMaximumDistance'],
		group: 'advanced',
	},
}

const mcbuildExportFormatOptions: aj.ExporterOptions['settings'] = {
	mcFilePath: {
		title: tl(`vanillaAnimation.settings.mcFilePath.title`),
		description: tl(`vanillaAnimation.settings.mcFilePath.description`),
		type: 'filepath',
		default: '',
		props: {
			target: 'file',
			dialogOpts: {
				get defaultPath() {
					return `${ANIMATED_JAVA.settings.animatedJava.projectName}.mc`
				},
				promptToCreate: true,
				properties: ['openFile'],
			},
		},
		onUpdate(d) {
			if (d.value === '') {
				d.isValid = false
				d.errors = emptySettingError
				return d
			}
			const p = pathjs.parse(d.value)
			if (p.base !== ANIMATED_JAVA.settings.animatedJava.projectName + '.mc') {
				d.isValid = false
				d.errors = format(
					tl('vanillaAnimation.settings.mcFilePath.errors.fileNameMustMatchProjectName'),
					{ projectName: ANIMATED_JAVA.settings.animatedJava.projectName }
				)
			}
			return d
		},
		isVisible(s) {
			return s.vanillaAnimation.exportFormat === 'mcbuild'
		},
		dependencies: ['vanillaAnimation.exportFormat'],
	},
}

const vanillaExportFormatOptions: aj.ExporterOptions['settings'] = {
	datapackPath: {
		title: tl(`vanillaAnimation.settings.datapackPath.title`),
		description: tl(`vanillaAnimation.settings.datapackPath.description`),
		type: 'filepath',
		default: '',
		props: {
			target: 'file',
			dialogOpts: {
				get defaultPath() {
					return `${ANIMATED_JAVA.settings.animatedJava.projectName}`
				},
				promptToCreate: true,
				properties: ['openFile'],
			},
		},
		onUpdate(d) {
			if (d.value === '') {
				d.isValid = false
				d.errors = emptySettingError
			}
			return d
		},
		isVisible(s) {
			return s.vanillaAnimation.exportFormat === 'vanilla'
		},
		dependencies: ['vanillaAnimation.exportFormat'],
	},
}

export const settings: aj.ExporterOptions['settings'] = {
	rootEntity: {
		title: tl(`vanillaAnimation.settings.rootEntity.title`),
		description: tl(`vanillaAnimation.settings.rootEntity.description`),
		type: 'text',
		default: 'minecraft:marker',
		onUpdate(d) {
			if (d.value === '') {
				d.isValid = false
				d.errors = emptySettingError
			} else if (!Entities.isEntity(d.value)) {
				d.isValid = false
				d.warnings.push(tl(`vanillaAnimation.settings.rootEntity.warnings.unknownEntity`))
			}
			return d
		},
	},

	rootEntityNbt: {
		title: tl(`vanillaAnimation.settings.rootEntityNbt.title`),
		description: tl(`vanillaAnimation.settings.rootEntityNbt.description`),
		type: 'text',
		default: '{}',
		onUpdate(d) {
			if (d.value !== '') {
				try {
					SNBT.parse(d.value)
				} catch (e: any) {
					d.isValid = false
					d.errors = tl(`vanillaAnimation.settings.rootEntityNbt.errors.invalidNbt`, {
						error: e.message,
					})
				}
			} else {
				d.isValid = false
				d.errors = emptySettingError
			}
			return d
		},
	},

	defaultToMarker: {
		title: tl(`vanillaAnimation.settings.defaultToMarker.title`),
		description: tl(`vanillaAnimation.settings.defaultToMarker.description`),
		type: 'checkbox',
		default: false,
		onUpdate(d) {
			return d
		},
	},

	exportFormat: {
		title: tl(`vanillaAnimation.settings.exportFormat.title`),
		description: tl(`vanillaAnimation.settings.exportFormat.description`),
		type: 'select',
		options: {
			mcbuild: tl('vanillaAnimation.settings.exportFormat.options.mcbuild'),
			vanilla: tl('vanillaAnimation.settings.exportFormat.options.vanilla'),
		},
		default: 'mcbuild',
		onUpdate(d) {
			return d
		},
	},
	...mcbuildExportFormatOptions,
	...vanillaExportFormatOptions,

	...advanced_settings,
}
