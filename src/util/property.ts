export class DeepClonedObjectProperty extends Property<'object'> {
	constructor(targetClass: any, name: string, options?: PropertyOptions) {
		super(targetClass, 'object', name, options)
	}

	merge(instance: any, data: any) {
		if (typeof data[this.name] === 'object') {
			instance[this.name] = JSON.parse(JSON.stringify(data[this.name]))
		}
	}

	copy(instance: any, target: any) {
		if (typeof instance[this.name] === 'object') {
			target[this.name] = JSON.parse(JSON.stringify(instance[this.name]))
		}
	}
}

export const fixClassPropertyInheritance: ClassDecorator = target => {
	target.properties = { ...target.properties }
	return target
}
