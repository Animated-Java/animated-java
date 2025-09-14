import PACKAGE from '@package'
import v2_0_0 from './versions/2.0.0'

export interface DfuProcessor<Old, New> {
	process(model: Old): New
}

/**
 * Upgrades an AJ Blueprint model to the latest version
 */
export function processAjBlueprint(model: any): any {
	const newModel = JSON.parse(JSON.stringify(model))
	const modelVersion = model.meta.format_version

	// If the current plugin version is greater than the model version, upgrade the model
	if (compareVersions(PACKAGE.version, modelVersion)) {
		// Sequentially update the model to the latest version taking advantage of switch fallthrough
		switch (true) {
			case compareVersions('2.0.0', modelVersion):
				v2_0_0.process(newModel)
		}
	}

	return newModel
}
