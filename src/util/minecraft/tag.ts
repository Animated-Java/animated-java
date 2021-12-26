export class MCTag {
	public name: string
	public values: Array<string>
	public replace: boolean

	constructor(name: string, values: Array<string>, replace: false) {
		this.name = name
		this.values = values
		this.replace = replace
	}

	toString() {
		return {
			replace: this.replace,
			values: this.values,
		}
	}
}
