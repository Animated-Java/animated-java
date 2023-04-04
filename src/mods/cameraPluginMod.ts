import { clearInterval } from 'timers'
import { CAMERA_CONFIG_ACTION } from '../ui/ajCameraConfig'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:cameraPluginMod',
	{
		installed: false,
		interval: undefined as NodeJS.Timeout | undefined,
		subContext: {} as any,
	},
	context => {
		context.interval = setInterval(() => {
			if (OutlinerElement.types.camera) {
				context.subContext = inject()
				context.installed = true
			}
		}, 50)
		return context
	},
	context => {
		if (context.installed && OutlinerElement.types.camera) {
			extract(context.subContext)
			context.installed = false
		}
		clearInterval(context.interval)
	}
)

function inject() {
	const camera = OutlinerElement.types.camera
	const context = {
		structure: [...camera.prototype.menu!.structure],
		teleported_entity_type: undefined as Property<any> | undefined,
	}
	camera.prototype.menu!.structure.splice(1, 0, CAMERA_CONFIG_ACTION)
	context.teleported_entity_type = new Property(camera, 'string', 'teleported_entity_type', {
		default: '',
	})
	return context
}

function extract(context: any) {
	const camera = OutlinerElement.types.camera
	camera.prototype.menu!.structure = context.structure
	context.teleported_entity_type.delete()
}
