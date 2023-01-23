import { Vector, Matrix, Gimbals } from './linear'

export class Bone {
	matrix!: Matrix
	constructor(
		public name: string,
		public origin: Vector,
		public rot: Gimbals,
		public scale: Vector,
		public children: Bone[]
	) {
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

	toGlobal(parent: Bone): Bone {
		const matrix = this.matrix.transform(parent.matrix)
		const scale = new Vector(matrix.x.length(), matrix.y.length(), matrix.z.length())
		return new Bone(
			this.name,
			this.origin.transform(parent.matrix).add(parent.origin),
			new Matrix(
				matrix.x.divide(scale.x),
				matrix.y.divide(scale.y),
				matrix.z.divide(scale.z)
			).toGimbal(),
			scale,
			[]
		)
	}

	exportChildren(parent: Bone) {
		let outputBones = [this.toGlobal(parent)]
		const childBones = this.children.map(bone => bone.exportChildren(outputBones[0]))
		for (let i = 0; i < childBones.length; i++) {
			outputBones.push(...childBones[i])
		}
		return outputBones
	}

	exportRoot() {
		let outputBones: Bone[] = []
		const childBones = this.children.map(bone => bone.exportChildren(this))
		for (let i = 0; i < childBones.length; i++) {
			outputBones.push(...childBones[i])
		}
		return outputBones
	}
}
