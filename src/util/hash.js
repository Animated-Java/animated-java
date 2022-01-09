import crypto from 'crypto'
export function animation(a) {
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
	hash.update(`name;${a.name}`)
	hash.update('loop;' + a.loop)
	hash.update('len;' + a.length)
	hash.update('loopdel;' + a.loop_delay)
	hash.update('startdel;' + a.start_delay)
	hash.update('blndw;' + a.blend_weight)
	hash.update('snp;' + a.snapping)
	hash.update('animtup;' + a.anim_time_update)
	return hash.digest('hex')
}

export function boneStructure() {
	const hash = crypto.createHash('sha512')

	function processGroup(group) {
		hash.update(`uuid;${group.uuid}`)
		hash.update(`name;${group.name}`)
		hash.update(`pos;(${group.origin.join(',')})`)
		hash.update(`rot;(${group.rotation.join(',')})`)
		hash.update(`vis;${group.visibility}`)
	}

	function recurse(children) {
		children.forEach(c => {
			if (c instanceof Group) {
				processGroup(c)
				recurse(c.children)
			}
		})
	}

	recurse(Outliner.root)
	return hash.digest('hex')
}
