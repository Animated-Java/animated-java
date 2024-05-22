import { PACKAGE } from '../constants'
import { TextDisplay } from '../outliner/textDisplay'
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

			const vanillaItemModels = new Map<THREE.Object3D, Group>()
			const objects: THREE.Object3D[] = []
			for (const group of Group.all) {
				const mesh = group.mesh.children.at(0)
				if (mesh?.isVanillaItemModel) {
					vanillaItemModels.set(mesh, group)
					objects.push(mesh)
				}
			}
			for (const element of OutlinerElement.all) {
				if (element instanceof TextDisplay) continue
				if (
					element.mesh instanceof THREE.Mesh &&
					element.mesh.geometry &&
					// @ts-expect-error
					element.visibility &&
					!element.locked
				) {
					objects.push(element.mesh)
				} else if (element instanceof Locator) {
					// @ts-expect-error
					objects.push(element.mesh.sprite as THREE.Sprite)
				}
			}

			const intersects = this.raycaster.intersectObjects(objects)
			const i = intersects.at(0) as THREE.Intersection
			if (!(i && i.uv && i.object instanceof THREE.Mesh && i.object.isVanillaItemModel))
				return raycast(event)
			const image = i.object.material.map!.image as HTMLImageElement
			const { width, height } = image
			const imageData = getImageData(image)
			const x = Math.ceil(i.uv.x * width) - 1
			const y = height - Math.ceil(i.uv.y * height)
			const I = (x + y * width) * 4
			if (imageData.data[I + 3] <= 140) return raycast(event)

			const group = vanillaItemModels.get(i.object)!
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

		return context
	},
	context => {
		Preview.prototype.raycast = context.originalRaycast
	}
)
