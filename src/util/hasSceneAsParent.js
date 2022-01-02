export function isSceneBased(self) {
	if (self.name === 'SCENE') return true
	if (self.parent) {
		if (self.parent.name !== 'SCENE') {
			return isSceneBased(self.parent)
		} else {
			return true
		}
	} else {
		return false
	}
}
