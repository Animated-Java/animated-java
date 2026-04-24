/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench/types/custom/util/version_util.d.ts" />
import { type IBlueprintFormatJSON, getDefaultProjectSettings } from '.'
import { PACKAGE } from '../../constants'
import { openUnexpectedErrorDialog } from '../../dialogs/unexpectedError/unexpectedError'

import old_v1_0 from './versions/old-1.0'
import old_v1_1 from './versions/old-1.1'
import old_v1_2 from './versions/old-1.2'
import old_v1_3 from './versions/old-1.3'
import old_v1_4 from './versions/old-1.4'

import v0_3_10 from './versions/0.3.10'
import v1_0_0_pre1 from './versions/1.0.0-pre1'
import v1_0_0_pre6 from './versions/1.0.0-pre6'
import v1_0_0_pre7 from './versions/1.0.0-pre7'
import v1_0_0_pre8 from './versions/1.0.0-pre8'
import v1_10_0_beta_1 from './versions/1.10.0-beta.1'
import v1_10_0_beta_4 from './versions/1.10.0-beta.4'
import v1_4_0 from './versions/1.4.0'
import v1_6_3 from './versions/1.6.3'
import v1_6_5 from './versions/1.6.5'
import v1_8_0 from './versions/1.8.0'

export function upgradeAnimatedJavaBlueprint(model: any): IBlueprintFormatJSON {
	if (model?.meta?.model_format === 'animatedJava/ajmodel') {
		model.meta.model_format = 'animated_java/ajmodel'
		model.meta.format_version = '0.0'
	}

	try {
		let needsUpgrade = model.meta.format_version.length === 3
		needsUpgrade =
			needsUpgrade || VersionUtil.compare(PACKAGE.version, '>', model.meta.format_version)
		if (!needsUpgrade) return model

		console.groupCollapsed(
			'Upgrading project from',
			model.meta.format_version,
			'to',
			PACKAGE.version
		)
		console.log('Original model:', JSON.parse(JSON.stringify(model)))

		if (model.meta.format_version.length === 3) {
			console.groupCollapsed(
				'Discovered outdated ajmodel format! Upgrading to blueprint format...'
			)
			try {
				if (VersionUtil.compare('1.0', '>', model.meta.format_version))
					model = old_v1_0(model)

				if (VersionUtil.compare('1.1', '>', model.meta.format_version))
					model = old_v1_1(model)

				if (VersionUtil.compare('1.2', '>', model.meta.format_version))
					model = old_v1_2(model)

				if (VersionUtil.compare('1.3', '>', model.meta.format_version))
					model = old_v1_3(model)

				if (VersionUtil.compare('1.4', '>', model.meta.format_version))
					model = old_v1_4(model)

				model.meta.format_version = '0.3.9'

				console.log(
					'Upgrade to blueprint format complete',
					JSON.parse(JSON.stringify(model))
				)
			} catch (e) {
				console.error('Failed to upgrade from ajmodel format to blueprint format', e)
				throw e
			} finally {
				console.groupEnd()
			}
		}

		// Versions below this are post 0.3.10. I changed the versioning system to use the AJ version instead of a unique format version.
		switch (true) {
			case VersionUtil.compare(model.meta.format_version, '<', '0.3.10'):
				model = v0_3_10(model)
			case VersionUtil.compare(model.meta.format_version, '<', '0.5.0'):
				model = v1_0_0_pre1(model)
			case VersionUtil.compare(model.meta.format_version, '<', '0.5.5'):
				model = v1_0_0_pre6(model)
			case VersionUtil.compare(model.meta.format_version, '<', '0.5.6'):
				model = v1_0_0_pre7(model)
			case VersionUtil.compare(model.meta.format_version, '<', '0.5.7'):
				model = v1_0_0_pre8(model)
			case VersionUtil.compare(model.meta.format_version, '<', '1.4.0'):
				model = v1_4_0(model)
			case VersionUtil.compare(model.meta.format_version, '<', '1.6.3'):
				model = v1_6_3(model)
			case VersionUtil.compare(model.meta.format_version, '<', '1.6.5'):
				model = v1_6_5(model)
			case VersionUtil.compare(model.meta.format_version, '<', '1.8.0'):
				model = v1_8_0(model)
			case VersionUtil.compare(model.meta.format_version, '<', '1.10.0-beta.1'):
				model = v1_10_0_beta_1(model)
			case VersionUtil.compare(model.meta.format_version, '<', '1.10.0-beta.4'):
				model = v1_10_0_beta_4(model)
		}

		// Remove unknown blueprint settings
		const defaultSettings = getDefaultProjectSettings()
		for (const key in model.blueprint_settings) {
			if (key in defaultSettings) continue
			console.warn('Removing unknown blueprint setting', key, model.blueprint_settings[key])
			delete model.blueprint_settings[key]
		}

		model.meta.format_version = '1.10.0'
		console.log('Upgrade complete', JSON.parse(JSON.stringify(model)))

		return model
	} catch (e: any) {
		openUnexpectedErrorDialog(e as Error)
		throw e
	} finally {
		console.groupEnd()
	}
}
