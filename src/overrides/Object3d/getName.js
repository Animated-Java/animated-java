export const getName = {
	value() {
		return Project.groups.find(group => group.mesh === this).name
	},
}
export const getGroup = {
	value() {
		return Project.groups.find(group => group.mesh === this)
	},
}
