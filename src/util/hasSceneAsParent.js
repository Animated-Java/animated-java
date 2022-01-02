export function hasSceneAsParent(self) {
	if (self.parent) {
		if (self.parent.name != 'SCENE') {
			return hasSceneAsParent(self.parent)
		} else {
			return true
		}
	} else {
		return false
	}
}
