export function ajAction(id: string, options: ActionOptions) {
	const action = new Blockbench.Action(id, options)
	// FIXME Add event for removal on plugin uninstall
	return action
}
