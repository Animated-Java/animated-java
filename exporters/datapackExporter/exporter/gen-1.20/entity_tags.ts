import { Globals as G } from './globals'

export function getTags() {
	return {
		new: 'aj.new',
		globalRigRoot: `aj.rig_root`,
		rigEntity: `aj.${G.PROJECT_NAME}.rig_entity`,
		rootEntity: `aj.${G.PROJECT_NAME}.root`,

		boneEntity: `aj.${G.PROJECT_NAME}.bone`,
		namedBoneEntity: `aj.${G.PROJECT_NAME}.bone.%s`,

		locatorOrigin: `aj.${G.PROJECT_NAME}.locator_origin`,
		namedLocatorOrigin: `aj.${G.PROJECT_NAME}.locator_origin.%s`,
		locatorEntity: `aj.${G.PROJECT_NAME}.locator`,
		namedLocatorEntity: `aj.${G.PROJECT_NAME}.locator.%s`,

		cameraOrigin: `aj.${G.PROJECT_NAME}.camera_origin`,
		namedCameraOrigin: `aj.${G.PROJECT_NAME}.camera_origin.%s`,
		cameraEntity: `aj.${G.PROJECT_NAME}.camera`,
		namedCameraEntity: `aj.${G.PROJECT_NAME}.camera.%s`,

		activeAnim: `aj.${G.PROJECT_NAME}.animation.%s`,
		disableCommandKeyframes: `aj.${G.PROJECT_NAME}.disable_command_keyframes`,
	}
}
