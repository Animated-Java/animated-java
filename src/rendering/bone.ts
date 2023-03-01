import { Vector, Matrix, Gimbals } from './linear'

interface IAJBoneOptions {
	name: string
	origin: Vector
	rot: Gimbals
	scale: Vector
	children: AJBone[]
}

export class AJBone {
	matrix: Matrix = new Matrix(new Vector(1, 0, 0), new Vector(0, 1, 0), new Vector(0, 0, 1))
	name: string
	origin: Vector
	rot: Gimbals
	scale: Vector
	children: AJBone[]
	constructor(options: IAJBoneOptions) {
		this.name = options.name
		this.origin = options.origin
		this.rot = options.rot
		this.scale = options.scale
		this.children = options.children
		this.setMatrix()
	}

	setOrigin(origin: Vector) {
		this.origin = origin
	}
	setRot(rot: Gimbals) {
		this.rot = rot
		this.setMatrix()
	}
	setScale(scale: Vector) {
		this.scale = scale
		this.setMatrix()
	}
	private setMatrix() {
		this.matrix = this.rot.toMatrix().multiply(this.scale)
	}

	toGlobal(parent: AJBone): AJBone {
		const matrix = this.matrix.transform(parent.matrix)
		const scale = new Vector(matrix.x.length(), matrix.y.length(), matrix.z.length())
		return new AJBone({
			name: this.name,
			origin: this.origin.transform(parent.matrix).add(parent.origin),
			rot: new Matrix(
				matrix.x.divide(scale.x),
				matrix.y.divide(scale.y),
				matrix.z.divide(scale.z)
			).toGimbals(),
			scale,
			children: [],
		})
	}

	exportChildren(parent: AJBone) {
		let outputBones = [this.toGlobal(parent)]
		const childBones = this.children.map(bone => bone.exportChildren(outputBones[0]))
		for (let i = 0; i < childBones.length; i++) {
			outputBones.push(...childBones[i])
		}
		return outputBones
	}

	exportRoot() {
		let outputBones: AJBone[] = []
		const childBones = this.children.map(bone => bone.exportChildren(this))
		for (let i = 0; i < childBones.length; i++) {
			outputBones.push(...childBones[i])
		}
		return outputBones
	}
}
