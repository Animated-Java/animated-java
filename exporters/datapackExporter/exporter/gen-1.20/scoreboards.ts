import { Globals as G } from './globals'

export function getScoreboards() {
	return {
		i: 'aj.i',
		id: 'aj.id',
		tweenTime: 'aj.tween_time',
		animTime: 'aj.anim_time',
		lifeTime: 'aj.life_time',
		exportVersion: `aj.${G.PROJECT_NAME}.export_version`,
		rigLoaded: `aj.${G.PROJECT_NAME}.rig_loaded`,
		loopMode: `aj.${G.PROJECT_NAME}.animation.%s.loop_mode`,
		localAnimTime: `aj.${G.PROJECT_NAME}.animation.%s.local_anim_time`,
	}
}
