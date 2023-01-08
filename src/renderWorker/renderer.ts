import type { AnimationDataBundle, DataOutliner, Result, Data } from './renderer.worker.types'
import { Pool } from './WorkerPool'
import RenderWorker from 'worker!./renderer.worker'
export const animationToDataset = (animation: Animation): Data => {
	function createTree(nodes: OutlinerNode[]): DataOutliner[] {
		return nodes
			.filter(node => node instanceof Group)
			.map(node => {
				let group = node as Group
				return {
					rot: group.rotation,
					origin: group.origin,
					children: createTree(group.children),
					id: group.uuid,
				}
			})
	}
	function createDataOutliner(): DataOutliner {
		return {
			rot: [0, 0, 0],
			origin: [0, 0, 0],
			children: createTree(Outliner.root),
			id: 'root',
		}
	}
	function animationToDataset(): AnimationDataBundle {
		let data: AnimationDataBundle = {
			keyframes: {},
			length: animation.length,
		}
		// @ts-ignore
		Object.entries(animation.animators).forEach(([key, animator]: [string, BoneAnimator]) => {
			data.keyframes[key] = animator.keyframes.map(keyframe => {
				return {
					bezier: {
						left_time: keyframe.bezier_left_time,
						left_value: keyframe.bezier_left_value,
						right_time: keyframe.bezier_right_time,
						right_value: keyframe.bezier_right_value,
						linked: keyframe.bezier_linked,
					},
					data_points: keyframe.data_points.map(point => ({ x: point.x, y: point.y, z: point.z })),
					time: keyframe.time,
					interpolation: keyframe.interpolation,
					channel: keyframe.channel,
				}
			})
		})
		return data
	}
	return {
		outliner: createDataOutliner(),
		animation: animationToDataset(),
	}
}
function runSub(w: RenderWorker, data: Data): Promise<Result> {
	return new Promise((resolve, reject) => {
		w.onerror = reject
		w.postMessage(data)
		let unsub: Function
		unsub = w.subscribe((result: Result) => {
			unsub()
			resolve(result)
		})
	})
}
export const workerPool = new Pool(
	5,
	() => {
		return new RenderWorker()
	},
	w => {
		// @ts-ignore
		return runSub(w, animationToDataset(Animation.selected))
	}
)
