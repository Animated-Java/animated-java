export class ProgressBarController {
	progress: number
	constructor(public message: string, public total: number) {
		this.progress = 0
		AnimatedJava.progress.set(0)
		AnimatedJava.progress_text.set(message)
	}

	add(change: number) {
		this.progress += change
	}

	update() {
		AnimatedJava.progress.set(this.progress / this.total)
	}

	setMessage(message: string) {
		this.message = message
		AnimatedJava.progress_text.set(message)
	}

	finish() {
		this.progress = 0
		AnimatedJava.progress.set(0)
		AnimatedJava.progress_text.set('')
	}
}
