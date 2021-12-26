import nbtlint from '../../dependencies/nbtlint/docs/nbt-lint'
import { JsonText } from './jsonText'

export enum NBTType {
	UNKNOWN,
	STRING,
	BYTE,
	SHORT,
	INT,
	LONG,
	FLOAT,
	DOUBLE,
	BOOL,
	COMPOUND,
	LIST,
	ARRAY_BYTE,
	ARRAY_INT,
	ARRAY_LONG,
}

const NBTTypeLookup: Record<NBTType, NBTType> = {
	[NBTType.UNKNOWN]: NBTType.LIST,
	[NBTType.STRING]: NBTType.LIST,
	[NBTType.BYTE]: NBTType.ARRAY_BYTE,
	[NBTType.SHORT]: NBTType.LIST,
	[NBTType.INT]: NBTType.ARRAY_INT,
	[NBTType.LONG]: NBTType.ARRAY_LONG,
	[NBTType.FLOAT]: NBTType.LIST,
	[NBTType.DOUBLE]: NBTType.LIST,
	[NBTType.COMPOUND]: NBTType.LIST,
	[NBTType.LIST]: NBTType.LIST,
	[NBTType.ARRAY_BYTE]: NBTType.LIST,
	[NBTType.ARRAY_INT]: NBTType.LIST,
	[NBTType.ARRAY_LONG]: NBTType.LIST,
	[NBTType.BOOL]: NBTType.ARRAY_BYTE,
}
type NBTDataType<T, V> = {
	type: T
	value: V
}
type NBTBaseNumber<T> = NBTDataType<T, number>
type NBTUnknown = NBTDataType<NBTType.UNKNOWN, unknown>

type NBTString = NBTDataType<NBTType.STRING, string>
type NBTCompound = NBTDataType<NBTType.COMPOUND, Record<string, any>>
type NBTByte = NBTBaseNumber<NBTType.BYTE>
type NBTShort = NBTBaseNumber<NBTType.SHORT>
type NBTInt = NBTBaseNumber<NBTType.INT>
type NBTLong = NBTBaseNumber<NBTType.LONG>
type NBTFloat = NBTBaseNumber<NBTType.FLOAT>
type NBTDouble = NBTBaseNumber<NBTType.DOUBLE>
type NBTBool = NBTDataType<NBTType.BOOL, boolean>
type NBTList = NBTDataType<NBTType.LIST, Array<NBTAnyType>>
type NBTArrayByte = NBTDataType<NBTType.ARRAY_BYTE, number[]>
type NBTArrayInt = NBTDataType<NBTType.ARRAY_INT, number[]>
type NBTArrayLong = NBTDataType<NBTType.ARRAY_LONG, number[]>
type NBTAnyType =
	| NBTString
	| NBTCompound
	| NBTUnknown
	| NBTByte
	| NBTShort
	| NBTInt
	| NBTLong
	| NBTFloat
	| NBTDouble
	| NBTList
	| NBTArrayByte
	| NBTArrayInt
	| NBTArrayLong
	| NBTBool

export class NBT<T> {
	private type: NBTType
	// The internal NBT compound
	private data: any

	constructor({ type, value }: NBTAnyType) {
		this.type = type
		this.data = value
	}

	private setValueIfCompoundOrThrow<U>(key: string, value: NBT<U>) {
		if (this.type !== NBTType.COMPOUND) {
			throw new Error(
				'unable to add keyed values to a non compound value'
			)
		}
		this.data[key] = value
	}

	public static Compound(value: NBTCompound['value'] = {}) {
		const nbtInstance = new NBT({
			type: NBTType.COMPOUND,
			value: {},
		})
		return nbtInstance
	}
	public Compound(key, value: NBTCompound['value'] = {}) {
		const item = NBT.Compound(value)
		this.setValueIfCompoundOrThrow<NBTCompound>(key, item)
		return this
	}

	public static String(value: any & { toString(): string }) {
		value = String(value)
		return new NBT({
			type: NBTType.STRING,
			value,
		})
	}
	public String(key: string, value: any & { toString(): string }) {
		const nbt = NBT.String(value)
		this.setValueIfCompoundOrThrow(key, nbt)
		return this
	}

	private static Number(type: NBTType, value: number) {
		return new NBT({
			type,
			value,
		} as NBTAnyType)
	}
	private Number(type: NBTType, key: string, value: number) {
		const nbt = NBT.Number(type, value)
		this.setValueIfCompoundOrThrow(key, nbt)
		return this
	}

	public static Byte(value: number) {
		return NBT.Number(NBTType.BYTE, value)
	}
	public Byte(key: string, value: number) {
		return this.Number(NBTType.BYTE, key, value)
	}

	public static Int(value: number) {
		return NBT.Number(NBTType.INT, value)
	}
	public Int(key: string, value: number) {
		return this.Number(NBTType.INT, key, value)
	}

	public static Short(value: number) {
		return NBT.Number(NBTType.SHORT, value)
	}
	public Short(key: string, value: number) {
		return this.Number(NBTType.SHORT, key, value)
	}

	public static Long(value: number) {
		return NBT.Number(NBTType.LONG, value)
	}
	public Long(key: string, value: number) {
		return this.Number(NBTType.LONG, key, value)
	}

	public static Float(value: number) {
		return NBT.Number(NBTType.FLOAT, value)
	}
	public Float(key: string, value: number) {
		return this.Number(NBTType.FLOAT, key, value)
	}

	public static Double(value: number) {
		return NBT.Number(NBTType.DOUBLE, value)
	}
	public Double(key: string, value: number) {
		return this.Number(NBTType.DOUBLE, key, value)
	}

	public static List<U>(values: NBT<U>[]) {
		if (values.length === 0) {
			throw new Error(
				'Unable to make List of length 0, lists require atleast 1 element.'
			)
		}
		for (let i = 1; i < values.length; i++) {
			if (values[i].type !== values[0].type) {
				throw new Error(
					'Unable to make List, lists require all elements to be the same type.'
				)
			}
		}
		const ListType = NBTTypeLookup[values[0].type]

		return new NBT({
			type: ListType,
			value: values,
		} as any)
	}
	public List<U>(key: string, values: NBT<U>[]) {
		const nbt = NBT.List(values)
		this.setValueIfCompoundOrThrow(key, nbt)
		return this
	}
	public ListOf(key: string, type: NBTType, values: any[]) {
		const nbtList = values.map(
			(value) =>
				new NBT({
					type,
					value,
				})
		)
		this.setValueIfCompoundOrThrow(key, NBT.List(nbtList))
		return this
	}
	public static ListOf(type: NBTType, values: any[]) {
		const nbtList = values.map(
			(value) =>
				new NBT({
					type,
					value,
				})
		)
		return NBT.List(nbtList)
	}

	public static Bool(value: boolean) {
		return new NBT({
			type: NBTType.BOOL,
			value,
		})
	}
	public Bool(key: string, value: boolean) {
		this.setValueIfCompoundOrThrow(key, NBT.Bool(value))
		return this
	}

	public toNbtLintTree() {
		let values: any
		switch (this.type) {
			case NBTType.UNKNOWN:
				console.log(`Unknown nbt tag type for tag`, this)
				throw new Error(
					`Unknown nbt tag. See above message for more info. `
				)

			case NBTType.LIST:
				values = []
				this.data.forEach((v: any) => values.push(v.toNbtLintTree()))
				return new nbtlint.TagList(undefined, values)

			case NBTType.ARRAY_BYTE:
				values = []
				this.data.forEach((v: any) => values.push(v.toNbtLintTree()))
				return new nbtlint.TagArrayByte(values)

			case NBTType.ARRAY_INT:
				values = []
				this.data.forEach((v: any) => values.push(v.toNbtLintTree()))
				return new nbtlint.TagArrayInt(values)

			case NBTType.ARRAY_LONG:
				values = []
				this.data.forEach((v: any) => values.push(v.toNbtLintTree()))
				return new nbtlint.TagArrayLong(values)

			case NBTType.COMPOUND:
				values = {}
				Object.entries(this.data).forEach(
					([k, v]: any) => (values[k] = v.toNbtLintTree())
				)
				return new nbtlint.TagCompound(values)

			case NBTType.STRING:
				return new nbtlint.TagString(this.data)
			case NBTType.BYTE:
				return new nbtlint.TagByte(this.data)
			case NBTType.INT:
				return new nbtlint.TagInteger(this.data)
			case NBTType.SHORT:
				return new nbtlint.TagShort(this.data)
			case NBTType.LONG:
				return new nbtlint.TagLong(this.data)
			case NBTType.FLOAT:
				return new nbtlint.TagFloat(this.data)
			case NBTType.DOUBLE:
				return new nbtlint.TagDouble(this.data)
			case NBTType.BOOL:
				return new nbtlint.TagByte(this.data ? 1 : 0, true)
		}
	}
}

// let root_entity = NBT.Compound()
// 	.String('Name', 'poo')
// 	.String('foo', 'bar')
// 	.Byte('FunnyNumber', 69)
// 	.Int('Blazin', 420)
// 	.ListOf('foos', NBTType.STRING, [
// 		'foo0',
// 		'foo1',
// 		'foo2',
// 		'foo3',
// 		'foo4',
// 		'foo5',
// 	])
// 	.Bool('ugly?', true)
// 	.String('This will fail the randomium test', 'Items:[')
// 	.List('literaly anything["test"]',[
// 		NBT.Bool(true),
// 		NBT.Bool(false)
// 	])
// 	.toNbtLintTree()

// console.log(root_entity)
// console.log(nbtlint.stringify(root_entity))
