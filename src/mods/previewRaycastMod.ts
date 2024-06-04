import { PACKAGE } from '../constants'
import { TextDisplay } from '../outliner/textDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
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
			if ((!isClick && !isHover) || Transformer.dragging) return raycast(event)
			convertTouchEvent(event)

			const canvasOffset = $(this.canvas).offset()!
			this.mouse.x = ((event.clientX - canvasOffset.left) / this.width) * 2 - 1
			this.mouse.y = -((event.clientY - canvasOffset.top) / this.height) * 2 + 1
			this.raycaster.setFromCamera(this.mouse, this.camera)

			const animatedJavaModels = new Map<
				THREE.Object3D,
				VanillaItemDisplay | TextDisplay | VanillaBlockDisplay
			>()
			const objects: THREE.Object3D[] = []
			for (const element of OutlinerElement.all) {
				// @ts-expect-error
				if (element.visibility === false) continue
				if (element instanceof TextDisplay) {
					const mesh = element.mesh.children.find(el => el.isTextDisplayText)
					if (mesh) {
						// Add the background mesh to the raycast to avoid raycasting through the complex text mesh
						objects.push(mesh.children[0])
						animatedJavaModels.set(mesh, element)
					}
				} else if (element instanceof VanillaItemDisplay) {
					if (!element.mesh) continue // Weird edge case.
					const mesh = element.mesh.children.at(0)
					if (!mesh) continue
					animatedJavaModels.set(mesh, element)
					if (mesh.isVanillaItemModel) {
						objects.push(mesh)
					} else if (mesh.isVanillaBlockModel) {
						for (const child of mesh.children) {
							objects.push(child)
						}
					}
				} else if (element instanceof VanillaBlockDisplay) {
					if (!element.mesh) continue // Weird edge case.
					const mesh = element.mesh.children.at(0)
					if (!mesh) continue
					animatedJavaModels.set(mesh, element)
					for (const child of mesh.children) {
						objects.push(child)
					}
				} else if (
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

			const intersects = this.raycaster.intersectObjects(objects, false)
			// const i = intersects.at(0) as THREE.Intersection
			for (const i of intersects) {
				if (i && i.uv && i.object instanceof THREE.Mesh && i.object.isVanillaItemModel) {
					const image = i.object.material.map!.image as HTMLImageElement
					const { width, height } = image
					const imageData = getImageData(image)
					const x = Math.ceil(i.uv.x * width) - 1
					const y = height - Math.ceil(i.uv.y * height)
					const I = (x + y * width) * 4
					if (imageData.data[I + 3] <= 140) continue

					const element = animatedJavaModels.get(i.object)
					if (element) {
						if (isHover) {
							element.preview_controller.updateHighlight(element, true)
							return { element }
						} else {
							element.select()
							// @ts-expect-error
							this.selection.click_target = element
						}
						return false
					}
				}
				if (i && i.object.parent?.isTextDisplayText) {
					const element = animatedJavaModels.get(i.object.parent)
					if (element) {
						if (isClick) {
							element.select()
							// @ts-expect-error
							this.selection.click_target = element
						}
						return false
					}
				} else if (i && i.object.parent?.isVanillaBlockModel) {
					const element = animatedJavaModels.get(i.object.parent)
					if (element) {
						if (isHover) {
							element.preview_controller.updateHighlight(element, true)
							return { element }
						} else {
							element.select()
							// @ts-expect-error
							this.selection.click_target = element
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
