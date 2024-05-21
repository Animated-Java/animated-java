import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

const ITEM_IMAGE_CACHE = new Map<HTMLImageElement, ImageData>()

function getImageData(image: HTMLImageElement) {
	if (ITEM_IMAGE_CACHE.has(image)) {
		return ITEM_IMAGE_CACHE.get(image)!
	}
	const canvas = document.createElement('canvas')
	const context = canvas.getContext(`2d`)!
	const { naturalWidth: w, naturalHeight: h } = image
	canvas.width = w
	canvas.height = h
	context.drawImage(image, 0, 0, w, h)
	const imageData = context.getImageData(0, 0, w, h)
	ITEM_IMAGE_CACHE.set(image, imageData)
	return imageData
}

createBlockbenchMod(
	`${PACKAGE.name}:previewRaycast`,
	{
		originalRaycast: Preview.prototype.raycast,
	},
	context => {
		Preview.prototype.raycast = function (this: Preview, event: MouseEvent) {
			const isClick = event.type === 'mousedown'
			const isHover = event.type === 'mousemove'
			const raycast = context.originalRaycast.bind(this)
			if (!isClick && !isHover) return raycast(event)
			convertTouchEvent(event)

			if (isHover) {
				for (const group of Group.all) {
					Group.preview_controller.updateHighlight(group)
				}
			}

			const canvasOffset = $(this.canvas).offset()!
			this.mouse.x = ((event.clientX - canvasOffset.left) / this.width) * 2 - 1
			this.mouse.y = -((event.clientY - canvasOffset.top) / this.height) * 2 + 1
			this.raycaster.setFromCamera(this.mouse, this.camera)

			const intersects = this.raycaster.intersectObjects(scene.children, true)
			if (intersects.length === 0) return raycast(event)

			for (const intersect of intersects) {
				if (intersect.object.isVanillaItemModel) {
					const object = intersect.object as THREE.Mesh
					const image = (object.material as THREE.MeshBasicMaterial).map!
						.image as HTMLImageElement
					const uv = intersect.uv!
					const { width, height } = image
					const imageData = getImageData(image)
					const x = Math.round(uv.x * width)
					const y = height - Math.round(uv.y * height)
					const I = (x + y * width) * 4
					const A = imageData.data[I + 3]
					if (A === 0) {
						continue
					}
					const group = Group.all.find(group => group.mesh.children.includes(object))
					if (group) {
						if (isHover) {
							// @ts-expect-error
							Group.preview_controller.updateHighlight(group, true)
						} else {
							group.select()
							// @ts-expect-error
							this.selection.click_target = group
						}
						return false
					}
				}
			}

			return raycast(event)
		}

		return context
	},
	context => {
		Preview.prototype.raycast = context.originalRaycast
	}
)
