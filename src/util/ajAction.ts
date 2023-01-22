export function ajAction(id: string, options: Blockbench.ActionOptions) {
	const action = new Blockbench.Action(id, options)
	return action
}
