import { tl } from '../../util/intl'
import ReactDOM from 'react-dom'
import React from 'react'
const Reasons = {
	BetaTester: 0,
	Moderator: 1,
	Dev: 2,
}
const roles = {
	[Reasons.BetaTester]: {
		get content() {
			return tl('about.closedBeta.content')
		},
		color: 'rgb(113,54,138)',
		textColor: 'red',
	},
	[Reasons.Moderator]: {
		get content() {
			return tl('about.moderator.content')
		},
		color: '#ffb11f',
		textColor: 'red',
	},
	[Reasons.Dev]: {
		get content() {
			return tl('about.dev.content')
		},
		color: '#00aced',
		textColor: 'red',
	},
	[Reasons.SpecialPerson]: {
		get content() {
			return tl('about.YokaiS.content')
		},
		color: '#deadbe',
		textColor: 'red',
	},
}
function Role({ role }) {
	return (
		<span
			style={{
				padding: '0px 4px',
				borderRadius: '2px',
				margin: '0px 4px',
				backgroundColor: roles[role].color,
				color: roles[role].textColor,
			}}
		>
			{roles[role].content}
		</span>
	)
}
function Person({ person }) {
	return (
		<div
			style={{
				backgroundColor: 'var(--color-dark)',
				borderRadius: '4px',
				border: '1px solid var(--color-border)',
				marginBottom: '20px',
				padding: '10px',
			}}
		>
			<p>{person.name}</p>
			<span>
				{person.roles.map((role) => (
					<Role key={role} role={role}></Role>
				))}
			</span>
		</div>
	)
}

const people = [
	{ roles: [Reasons.BetaTester, Reasons.Moderator], name: 'Ersatz' },
	{
		roles: [Reasons.BetaTester, Reasons.Moderator, Reasons.SpecialPerson],
		name: 'YokaiS',
	},
	{ roles: [Reasons.BetaTester, Reasons.Moderator], name: 'Ancientkingg' },
	{ roles: [Reasons.BetaTester, Reasons.Moderator], name: 'dragonmaster95' },
	{ roles: [Reasons.BetaTester], name: 'CommanderRedstone' },
	{ roles: [Reasons.BetaTester], name: 'Flubberschnub' },
	{ roles: [Reasons.BetaTester], name: 'Matt/Arwen' },
	{ roles: [Reasons.BetaTester], name: 'gibbs' },
	{ roles: [Reasons.BetaTester], name: 'JayPeaSize' },
	{ roles: [Reasons.BetaTester], name: 'Kastle' },
	{ roles: [Reasons.BetaTester], name: 'legitimoose' },
	{ roles: [Reasons.BetaTester], name: 'Nerdrope' },
	{ roles: [Reasons.BetaTester], name: 'Onnowhere' },
	{ roles: [Reasons.BetaTester], name: '_JeffWooden' },
	{ roles: [Reasons.BetaTester], name: 'CommandWitchery' },
	{ roles: [Reasons.BetaTester], name: 'Eriol_Eandur' },
	{ roles: [Reasons.BetaTester], name: 'Kyle10BC' },
	{ roles: [Reasons.BetaTester], name: 'MrMakistein' },
	{ roles: [Reasons.BetaTester], name: 'Sprunkles' },
	{ roles: [Reasons.BetaTester], name: 'Suso' },
	{ roles: [Reasons.BetaTester], name: 'TheRedstoneer' },
	{ roles: [Reasons.BetaTester], name: 'taj' },
	{ roles: [Reasons.BetaTester], name: 'Totigonzales' },
	{ roles: [Reasons.BetaTester], name: 'VelVoxelRaptor' },
	{ roles: [Reasons.BetaTester], name: 'Violet' },
]
function About() {
	return (
		<div>
			<h1>{tl('animatedJava')}</h1>
			<p>
				<b>Version:</b> {process.env.PLUGIN_VERSION}
			</p>

			<h3>Developers</h3>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'space-evenly',
				}}
			>
				<Person
					person={{
						name: 'FetchBot',
						roles: [Reasons.Dev],
					}}
				></Person>
				<Person
					person={{
						name: 'SnaveSutit',
						roles: [Reasons.Dev],
					}}
				></Person>
			</div>
			<h4>Honourable Mentions</h4>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'space-evenly',
				}}
			>
				{people.map((person) => (
					<Person key={person.name} person={person} />
				))}
			</div>
			<p>
				<b>Build ID:</b> {process.env.BUILD_ID}
			</p>
		</div>
	)
}
export function show_about() {
	new Dialog({
		id: 'animatedJava.about',
		// width: 1024,
		title: tl('animatedJava.dialog.about.title'),
		// lines: [format(tl('animatedJava.dialog.about.body'), {
		// 	version: process.env.PLUGIN_VERSION,
		// 	buildID: process.env.BUILD_ID
		// })],
		lines: [`<div id="animated_java_about"></div>`],
		//@ts-ignore
		width: 768,
		buttons: [],
		// component: {
		// 	template: `
		// 	<div>
		// 		<p><b>Version:</b> ${process.env.PLUGIN_VERSION}</p>
		// 		<p>
		// 			<b>Build ID:</b> ${process.env.BUILD_ID}
		// 		</p>
		// 		<h5>Honourable Mentions</h5>
		// 		<ul>
		// 			<li style="color:var(--color-text)">
		// 				Ancientkingg
		// 				<span style="color:var(--color-accent)">#0420</span>
		// 			</li>
		// 			<li style="color:var(--color-text)">
		// 				_JeffWooden
		// 				<span style="color:var(--color-accent)">#0895</span>
		// 			</li>
		// 		</ul>
		// 	</div>
		// 	`,
		// },
	}).show()
	ReactDOM.render(<About />, document.getElementById('animated_java_about'))
}
