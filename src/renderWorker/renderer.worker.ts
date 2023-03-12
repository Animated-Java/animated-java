// import { AJBone } from '../rendering/bone'
// import { Gimbals, Vector } from '../rendering/linear'
// import molang from 'molangjs'
// import * as DataTypes from './renderer.worker.types'

// function interpolate(
// 	channel: 'position' | 'rotation' | 'scale',
// 	allow_expression: boolean,
// 	axis: 'x' | 'y' | 'z',
// 	time: number
// ) {
// 	var before = false
// 	var after = false
// 	var result = false
// 	let epsilon = 1 / 1200

// 	function mapAxes(cb) {
// 		if (!Animator._last_values[channel]) Animator._last_values[channel] = [0, 0, 0]
// 		if (axis) {
// 			let result = cb(axis)
// 			Animator._last_values[channel][axis] = result
// 			return result
// 		} else {
// 			return ['x', 'y', 'z'].map(axis => {
// 				let result = cb(axis)
// 				Animator._last_values[channel][axis] = result
// 				return result
// 			})
// 		}
// 	}

// 	for (var keyframe of this[channel]) {
// 		if (keyframe.time < time) {
// 			if (!before || keyframe.time > before.time) {
// 				before = keyframe
// 			}
// 		} else {
// 			if (!after || keyframe.time < after.time) {
// 				after = keyframe
// 			}
// 		}
// 		i++
// 	}
// 	if (before && Math.epsilon(before.time, time, epsilon)) {
// 		result = before
// 	} else if (after && Math.epsilon(after.time, time, epsilon)) {
// 		result = after
// 	} else if (before && before.interpolation == Keyframe.interpolation.step) {
// 		result = before
// 	} else if (before && !after) {
// 		result = before
// 	} else if (after && !before) {
// 		result = after
// 	} else if (!before && !after) {
// 		//
// 	} else {
// 		let no_interpolations = Blockbench.hasFlag('no_interpolations')
// 		let alpha = Math.getLerp(before.time, after.time, time)

// 		if (
// 			no_interpolations ||
// 			(before.interpolation === Keyframe.interpolation.linear &&
// 				after.interpolation === Keyframe.interpolation.linear)
// 		) {
// 			if (no_interpolations) {
// 				alpha = Math.round(alpha)
// 			}
// 			return mapAxes(axis => before.getLerp(after, axis, alpha, allow_expression))
// 		} else if (
// 			before.interpolation === Keyframe.interpolation.catmullrom ||
// 			after.interpolation === Keyframe.interpolation.catmullrom
// 		) {
// 			let sorted = this[channel].slice().sort((kf1, kf2) => kf1.time - kf2.time)
// 			let before_index = sorted.indexOf(before)
// 			let before_plus = sorted[before_index - 1]
// 			let after_plus = sorted[before_index + 2]

// 			return mapAxes(axis =>
// 				before.getCatmullromLerp(before_plus, before, after, after_plus, axis, alpha)
// 			)
// 		} else if (
// 			before.interpolation === Keyframe.interpolation.bezier ||
// 			after.interpolation === Keyframe.interpolation.bezier
// 		) {
// 			// Bezier
// 			return mapAxes(axis => before.getBezierLerp(before, after, axis, alpha))
// 		}
// 	}
// 	if (result && result instanceof Keyframe) {
// 		let keyframe = result
// 		let method = allow_expression ? 'get' : 'calc'
// 		let dp_index =
// 			keyframe.time > time || Math.epsilon(keyframe.time, time, epsilon)
// 				? 0
// 				: keyframe.data_points.length - 1

// 		return mapAxes(axis => keyframe[method](axis, dp_index))
// 	}
// 	return false
// }

// function buildBoneTree(node: DataTypes.DataOutliner): {
// 	boneTree: AJBone
// 	boneList: AJBone[]
// } {
// 	const boneList: AJBone[] = []

// 	function recurse(node: DataTypes.DataOutliner) {
// 		const children: AJBone[] = []

// 		for (const child of node.children) {
// 			children.push(recurse(child))
// 		}

// 		const bone = new AJBone(
// 			node.id,
// 			new Vector(node.origin[0], node.origin[1], node.origin[2]),
// 			new Gimbals(node.rot[0], node.rot[1], node.rot[2]),
// 			new Vector(1, 1, 1),
// 			children
// 		)

// 		boneList.push(bone)
// 		return bone
// 	}

// 	const boneTree = recurse(node)
// 	return { boneTree, boneList }
// }

// export default async function (data: DataTypes.Data): Promise<DataTypes.Result> {
// 	console.log('Render Worker Input:', { data })
// 	const { boneTree, boneList } = buildBoneTree(data.outliner)

// 	return data
// }
