import crypto from 'crypto'
export function hashAnim(a) {
	const hash = crypto.createHash('sha512')
	function kf(k) {
		k.forEach((v) => {
			hash.update('kf;')
			hash.update(v.time + ');')
			v.data_points.forEach((dp) => {
				hash.update(`${dp.x};${dp.y};${dp.z};${dp.script_string};`)
			})
		})
	}
	Object.keys(a.animators).forEach((n) => {
		const i = a.animators[n]
		if (i instanceof BoneAnimator) {
			hash.update(`ba;${i.uuid};`)
			hash.update('scl;')
			kf(i.scale)
			hash.update('pos;')
			kf(i.position)
			hash.update('rot;')
			kf(i.rotation)
		} else if (i instanceof EffectAnimator) {
			hash.update(`ea;${i.uuid};`)
			hash.update('prt;')
			kf(i.particle)
			hash.update('snd;')
			kf(i.sound)
			hash.update('tmln;')
			kf(i.timeline)
		}
	})
	return hash.digest('hex')
}
