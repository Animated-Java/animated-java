import { Globals as G } from './globals'

export function getTags() {
	return {
		new: 'aj.new',
		globalRigRoot: `aj.rig_root`,
		rigEntity: `aj.${G.PROJECT_NAME}.rig_entity`,
		rootEntity: `aj.${G.PROJECT_NAME}.root`,
		boneEntity: `aj.${G.PROJECT_NAME}.bone`,
		locatorEntity: `aj.${G.PROJECT_NAME}.locator`,
		cameraEntity: `aj.${G.PROJECT_NAME}.camera`,
		namedBoneEntity: `aj.${G.PROJECT_NAME}.bone.%s`,
		namedLocatorEntity: `aj.${G.PROJECT_NAME}.locator.%s`,
		namedCameraEntity: `aj.${G.PROJECT_NAME}.camera.%s`,
		activeAnim: `aj.${G.PROJECT_NAME}.animation.%s`,
		locatorTarget: `aj.${G.PROJECT_NAME}.locator_target`,
		namedLocatorTarget: `aj.${G.PROJECT_NAME}.locator_target.%s`,
		cameraTarget: `aj.${G.PROJECT_NAME}.camera_target`,
		namedCameraTarget: `aj.${G.PROJECT_NAME}.camera_target.%s`,
		disableCommandKeyframes: `aj.${G.PROJECT_NAME}.disable_command_keyframes`,
	}
}
