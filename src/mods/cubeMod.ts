import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod, createPropertySubscribable } from '../util/moddingTools'

const ERROR_OUTLINE_MATERIAL = Canvas.outlineMaterial.clone()
ERROR_OUTLINE_MATERIAL.color = new THREE.Color(1, 0, 0)

let toast: Deletable | undefined
function showInvalidCubeToast() {
	if (!toast)
		toast = Blockbench.showToastNotification({
			text: 'Some Cubes have invalid rotations!',
			color: 'var(--color-error)',
			icon: 'error',
			click: () => {
				validateAllCubes()
				return false
			},
		})
}

function validateCube(cube: Cube) {
	// Validate a cube by checking if the rotation is in [-45, -22.5, 0, 22.5, 45] and that it's only rotated on a single axis
	if (
		!(
			(cube.rotation.allAre(i => i === 0) ||
				cube.rotation.filter(v => v !== 0).length === 1) &&
			cube.rotation.every(v => [-45, -22.5, 0, 22.5, 45].includes(v))
		)
	) {
		cube.mesh.outline.material = ERROR_OUTLINE_MATERIAL
		cube.forceVisible = true
		showInvalidCubeToast()
		return false
	} else if (cube.mesh.outline.material === ERROR_OUTLINE_MATERIAL) {
		cube.mesh.outline.material = Canvas.outlineMaterial
		cube.forceVisible = false
	}
	return true
}

function validateAllCubes() {
	const cubes = Cube.all.map(cube => validateCube(cube))
	if (toast && cubes.every(v => v)) {
		toast.delete()
		toast = undefined
	}
}

export function getInvalidCubes() {
	return Cube.all.filter(cube => !validateCube(cube))
}

export function createChaos(chaosLevel = 1000) {
	for (let i = 0; i < chaosLevel; i++) {
		setTimeout(() => {
			const cube = Cube.all[Math.floor(Math.random() * Cube.all.length)]
			cube.rotation = cube.rotation.map(() => Math.random() * 360) as ArrayVector3
			Canvas.updateAll()
		}, i * 10)
	}
	return new Promise(resolve => setTimeout(resolve, chaosLevel * 10))
}

createBlockbenchMod(
	'animated_java:cube_verifier',
	{},
	() => {
		return setInterval(() => {
			if (Format === ajModelFormat) validateAllCubes()
		}, 1000)
	},
	context => {
		clearInterval(context)
	}
)

createBlockbenchMod(
	'animated_java:cube',
	{
		originalInit: Cube.prototype.init,
	},
	context => {
		Cube.prototype.init = function (this: Cube) {
			const result = context.originalInit.call(this)

			this.forceVisible = false

			const [visibleGetter] = createPropertySubscribable(this.mesh.outline, 'visible')
			visibleGetter.subscribe(({ storage }) => {
				if (Format === ajModelFormat) storage.value = this.forceVisible || storage.value
			})

			return result
		}
		return context
	},
	context => {
		Cube.prototype.init = context.originalInit
	}
)

// createBlockbenchMod(
// 	'animated_java:cube.preview_controller',
// 	{
// 		updateVisibility: NodePreviewController.prototype.updateVisibility,
// 		updateTransform: NodePreviewController.prototype.updateTransform,
// 	},
// 	context => {
// 		NodePreviewController.prototype.updateTransform = function (
// 			this: NodePreviewController,
// 			element: OutlinerNode
// 		) {
// 			context.updateTransform.call(this, element)
// 			if (Format === ajModelFormat && element instanceof Cube) validateCube(element)
// 		}

// 		return context
// 	},
// 	context => {
// 		NodePreviewController.prototype.updateVisibility = context.updateVisibility
// 		NodePreviewController.prototype.updateTransform = context.updateTransform
// 	}
// )
