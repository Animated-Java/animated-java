export class ProgressBarController {
	progress: number
	constructor(public message: string, public total: number) {
		this.progress = 0
		Blockbench.setStatusBarText(message)
	}

	add(change: number) {
		this.progress += change
		Blockbench.setProgress(this.progress / this.total)
	}

	finish() {
		this.progress = 0
		Blockbench.setProgress(0)
		Blockbench.showStatusMessage('', 1)
	}
}
