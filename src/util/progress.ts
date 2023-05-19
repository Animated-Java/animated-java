export class ProgressBarController {
	progress: number
	constructor(public message: string, public total: number) {
		this.progress = 0
		Blockbench.setStatusBarText(message)
	}

	add(change: number) {
		this.progress += change
	}

	update() {
		Blockbench.setProgress(this.progress / this.total)
	}

	setMessage(message: string) {
		this.message = message
		Blockbench.setStatusBarText(message)
	}

	finish() {
		this.progress = 0
		Blockbench.setProgress(0)
		Blockbench.setStatusBarText()
	}
}
