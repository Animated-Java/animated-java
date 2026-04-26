export default function upgrade(model: any) {
	console.log('Processing model format 1.0', model)
	const fixed = JSON.parse(JSON.stringify(model))

	if (fixed.meta.settings) {
		console.log('Upgrading settings...')
		const animatedJava: any = {
			settings: {
				project_name: fixed.meta.settings.animatedJava.projectName,
				verbose: fixed.meta.settings.animatedJava.verbose,
				rig_item: fixed.meta.settings.animatedJava.rigItem,
				rig_item_model: fixed.meta.settings.animatedJava.predicateFilePath,
				rig_export_folder: fixed.meta.settings.animatedJava.rigModelsExportFolder,
			},
			exporter_settings: {},
			variants: [],
		}

		fixed.animated_java = animatedJava
	}

	if (fixed.meta.variants) {
		console.log('Upgrading variants...')
		const variants: any[] = []

		for (const [name, variant] of Object.entries(fixed.meta.variants as Record<string, any>)) {
			variants.push({
				name,
				uuid: guid(),
				textureMap: variant,
				default: name === 'default',
				boneConfig: {},
				affectedBones: [],
				affectedBonesIsAWhitelist: false,
			})
		}

		fixed.animated_java.variants = variants
	}

	if (
		fixed.animations?.find((a: any) =>
			Object.keys(a.animators as Record<string, any>).find(name => name === 'effects')
		)
	) {
		console.log('Upgrading effects...')

		for (const animation of fixed.animations) {
			const effects = animation.animators.effects
			if (!effects) continue
			for (const keyframe of effects.keyframes) {
				if (keyframe.channel !== 'timeline') continue
				for (const dataPoint of keyframe.data_points) {
					if (dataPoint.script) {
						dataPoint.commands = dataPoint.script
						delete dataPoint.script
						keyframe.channel = 'commands'
					}
				}
			}
		}

		console.log('Upgrading effects complete', fixed.animations)
	}

	delete fixed.meta.variants
	delete fixed.meta.settings
	delete fixed.meta.uuid

	return fixed
}
