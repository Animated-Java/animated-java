export function objectEqual(a: any, b: any) {
	/*Make sure the object is of the same type as this*/
	if (typeof b !== typeof a) return false

	/*Iterate through the properties of this object looking for a discrepancy between this and obj*/
	for (var property in a) {
		/*Return false if obj doesn't have the property or if its value doesn't match this' value*/
		if (typeof b[property] == 'undefined') return false
		if (b[property] != a[property]) return false
		if (typeof b[property] == 'object') {
			/*If the property is an object, recursively check it*/
			if (!b[property].equals(a[property])) return false
		}
	}

	/*Object's properties are equivalent */
	return true
}
