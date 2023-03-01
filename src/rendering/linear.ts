export class Vector {
	constructor(public x: number, public y: number, public z: number) {}

	transform(matrix: Matrix): Vector {
		return new Vector(
			matrix.x.x * this.x + matrix.y.x * this.y + matrix.z.x * this.z,
			matrix.x.y * this.x + matrix.y.y * this.y + matrix.z.y * this.z,
			matrix.x.z * this.x + matrix.y.z * this.y + matrix.z.z * this.z
		)
	}

	add(vector: Vector): Vector {
		return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z)
	}

	multiply(scalar: number): Vector {
		return new Vector(this.x * scalar, this.y * scalar, this.z * scalar)
	}

	divide(divisor: number): Vector {
		const reciprocal = 1 / divisor
		return new Vector(this.x * reciprocal, this.y * reciprocal, this.z * reciprocal)
	}

	length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
	}

	static fromArray(vector: [number, number, number]): Vector {
		return new Vector(vector[0], vector[1], vector[2])
	}
}

export class Matrix {
	constructor(public x: Vector, public y: Vector, public z: Vector) {}

	transform(matrix: Matrix): Matrix {
		return new Matrix(
			this.x.transform(matrix),
			this.y.transform(matrix),
			this.z.transform(matrix)
		)
	}

	multiply(vector: Vector): Matrix {
		return new Matrix(
			this.x.multiply(vector.x),
			this.y.multiply(vector.y),
			this.z.multiply(vector.z)
		)
	}

	scale(scalar: number): Matrix {
		return new Matrix(this.x.multiply(scalar), this.y.multiply(scalar), this.z.multiply(scalar))
	}

	toGimbals(): Gimbals {
		const y = -Math.atan2(this.x.z, Math.sqrt(this.x.x * this.x.x + this.x.y * this.x.y))
		const z =
			Math.atan2(this.x.y, this.x.x) * Math.ceil(Math.min((y + 0.5 * Math.PI) % Math.PI, 1))
		const cosZ = Math.cos(z)
		const sinZ = Math.sin(z)
		const x = Math.atan2(
			this.y.z * Math.cos(y) + (this.y.x * cosZ + this.y.y * sinZ) * Math.sin(y),
			this.y.y * cosZ - this.y.x * sinZ
		)
		return new Gimbals((x * 180) / Math.PI, (y * 180) / Math.PI, (z * 180) / Math.PI)
	}
}

export class Gimbals {
	constructor(public x: number, public y: number, public z: number) {}

	toMatrix(): Matrix {
		const cosX = Math.cos((this.x * Math.PI) / 180)
		const cosY = Math.cos((this.y * Math.PI) / 180)
		const cosZ = Math.cos((this.z * Math.PI) / 180)
		const sinX = Math.sin((this.x * Math.PI) / 180)
		const sinY = Math.sin((this.y * Math.PI) / 180)
		const sinZ = Math.sin((this.z * Math.PI) / 180)

		return new Matrix(
			new Vector(1, 0, 0),
			new Vector(0, cosX, sinX),
			new Vector(0, -sinX, cosX)
		)
			.transform(
				new Matrix(
					new Vector(cosY, 0, -sinY),
					new Vector(0, 1, 0),
					new Vector(sinY, 0, cosY)
				)
			)
			.transform(
				new Matrix(
					new Vector(cosZ, sinZ, 0),
					new Vector(-sinZ, cosZ, 0),
					new Vector(0, 0, 1)
				)
			)
	}

	static fromArray(gimbals: [number, number, number]): Gimbals {
		return new Gimbals(gimbals[0], gimbals[1], gimbals[2])
	}
}
