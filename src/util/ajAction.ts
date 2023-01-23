export function ajAction(id: string, options: Blockbench.ActionOptions) {
	const action = new Blockbench.Action(id, options)
	// FIXME Add event for removal on plugin uninstall
	return action
}
