import { tl } from '../../util/intl'
import { format } from '../../util/replace'

export function show_about() {
	const dialog = new Dialog({
		id: 'animatedJava.about',
		width: 1024,
		title: tl('animatedJava.dialog.about.title'),
		// lines: [format(tl('animatedJava.dialog.about.body'), {
		// 	version: process.env.PLUGIN_VERSION,
		// 	buildID: process.env.BUILD_ID
		// })],
		component: {
			template: `
			<div>
				<p><b>Version:</b> ${process.env.PLUGIN_VERSION}</p>
				<p>
					<b>Build ID:</b> ${process.env.BUILD_ID}
				</p>
				<h5>Honourable Mentions</h5>
				<ul>
					<li style="color:var(--color-text)">
						Ancientkingg
						<span style="color:var(--color-accent)">#0420</span>
					</li>
					<li style="color:var(--color-text)">
						_JeffWooden
						<span style="color:var(--color-accent)">#0895</span>
					</li>
				</ul>
			</div>
			`,
		},
		cancelEnabled: false,
		onConfirm() {
			dialog.hide().delete()
		},
	}).show()
}
