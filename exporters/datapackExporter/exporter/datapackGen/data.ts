import { Globals as G } from './globals'

export function getScoreboard() {
	return {
		i: 'aj.i',
		id: 'aj.id',
		tweenTime: 'aj.tween_time',
		animTime: 'aj.anim_time',
		lifeTime: 'aj.life_time',
		exportVersion: `aj.${G.NAMESPACE}.export_version`,
		rigLoaded: `aj.${G.NAMESPACE}.rig_loaded`,
		loopMode: `aj.${G.NAMESPACE}.animation.%s.loop_mode`,
		localAnimTime: `aj.${G.NAMESPACE}.animation.%s.local_anim_time`,
	}
}

export function getTags() {
	return {
		new: 'aj.new',
		rigEntity: `aj.${G.NAMESPACE}.rig_entity`,
		rootEntity: `aj.${G.NAMESPACE}.root`,
		boneEntity: `aj.${G.NAMESPACE}.bone`,
		locatorEntity: `aj.${G.NAMESPACE}.locator`,
		cameraEntity: `aj.${G.NAMESPACE}.camera`,
		namedBoneEntity: `aj.${G.NAMESPACE}.bone.%s`,
		namedLocatorEntity: `aj.${G.NAMESPACE}.locator.%s`,
		namedCameraEntity: `aj.${G.NAMESPACE}.camera.%s`,
		activeAnim: `aj.${G.NAMESPACE}.animation.%s`,
		locatorTarget: `aj.${G.NAMESPACE}.locator_target`,
		namedLocatorTarget: `aj.${G.NAMESPACE}.locator_target.%s`,
		cameraTarget: `aj.${G.NAMESPACE}.camera_target`,
		namedCameraTarget: `aj.${G.NAMESPACE}.camera_target.%s`,
		disableCommandKeyframes: `aj.${G.NAMESPACE}.disable_command_keyframes`,
	}
}

export function getEntityTypes() {
	return {
		ajRigEntity: `#${G.NAMESPACE}:aj_rig_entity`,
		ajRoot: `#${G.NAMESPACE}:aj_root`,
		ajBone: `#${G.NAMESPACE}:aj_bone`,
	}
}

export const loopModes = ['loop', 'once', 'hold']
