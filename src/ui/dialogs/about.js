import { tl } from '../../util/intl'
import ReactDOM from 'react-dom'
import React from 'react'
import logo from '../../assets/Animated_Java_2022.svg'
import snavesutitpfp from '../../assets/YokaiS_Snave.png'
import fetchbotpfp from '../../assets/YokaiS_Fetchbot.png'
const Reasons = {
	BetaTester: 0,
	Moderator: 1,
	Contributor: 2,
	BrandingArtist: 3,
	Youtuber: 4,
	Translator: 5,
	PatreonT1: 6,
	PatreonT2: 7,
	PatreonT3: 8,
	CurrentPatreon: 9,
}
const roles = {
	[Reasons.Translator]: {
		get content() {
			return tl('animatedJava.dialogs.about.translator')
		},
		color: '#E67E22',
		textColor: 'black',
	},
	[Reasons.BetaTester]: {
		get content() {
			return tl('animatedJava.dialogs.about.closedBeta')
		},
		color: '#9B59B6',
		textColor: 'black',
	},
	[Reasons.Moderator]: {
		get content() {
			return tl('animatedJava.dialogs.about.moderator')
		},
		color: '#19B395',
		textColor: 'black',
	},
	[Reasons.Contributor]: {
		get content() {
			return tl('animatedJava.dialogs.about.contributor')
		},
		color: '#00aced',
		textColor: 'black',
	},
	[Reasons.BrandingArtist]: {
		get content() {
			return tl('animatedJava.dialogs.about.brandingArtist')
		},
		color: '#00aced',
		textColor: 'black',
	},
	[Reasons.Youtuber]: {
		get content() {
			return tl('animatedJava.dialogs.about.youtuber')
		},
		color: '#FF0000',
		textColor: 'white',
	},
	[Reasons.PatreonT1]: {
		get content() {
			return tl('animatedJava.dialogs.about.patronTier1')
		},
		color: 'rgb(241, 196, 15)',
		textColor: 'black',
	},
	[Reasons.PatreonT2]: {
		get content() {
			return tl('animatedJava.dialogs.about.patronTier2')
		},
		color: 'rgb(241, 196, 15)',
		textColor: 'black',
	},
	[Reasons.PatreonT3]: {
		get content() {
			return tl('animatedJava.dialogs.about.patronTier3')
		},
		color: 'rgb(241, 196, 15)',
		textColor: 'black',
	},
}
function Role({ role, fontSize }) {
	return (
		<span
			style={{
				padding: '0px 4px',
				borderRadius: '2px',
				margin: '4px 4px',
				fontSize,
				fontWeight: '600',
				backgroundColor: roles[role].color,
				color: roles[role].textColor,
			}}
		>
			{roles[role].content}
		</span>
	)
}
function Person({ person }) {
	const fontSize = person.fontSize || '1.1em'
	return (
		<div
			style={{
				backgroundColor: 'var(--color-back)',
				borderRadius: '4px',
				border: '4px solid var(--color-border)',
				marginBottom: '20px',
				padding: '10px',
			}}
		>
			<p
				style={{
					textAlign: 'center',
					fontSize,
					fontWeight: '600',
				}}
			>
				{/* {person.active && (
					<i
						className="fas fa-check"
						style={{ marginRight: '8px' }}
					></i>
				)} */}
				{person.name}
			</p>
			<ul>
				{person.roles.map((role, i) => (
					<li
						style={{
							display: 'flex',
							justifyContent: 'center',
						}}
						key={i}
					>
						<Role role={role} fontSize={fontSize}></Role>
					</li>
				))}
			</ul>
		</div>
	)
}

const people = [
	{
		roles: [
			Reasons.BetaTester,
			Reasons.Moderator,
			Reasons.Contributor,
			Reasons.Translator,
		],
		name: 'Ancientkingg',
	},
	{
		roles: [
			Reasons.BetaTester,
			Reasons.Moderator,
			Reasons.BrandingArtist,
			Reasons.Translator,
		],
		name: 'YokaiS',
	},
	{ roles: [Reasons.BetaTester, Reasons.Moderator], name: 'dragonmaster95' },
	{ roles: [Reasons.BetaTester, Reasons.Moderator], name: 'Ersatz' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'CommandWitchery' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'MrMakistein' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'Flubberschnub' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'legitimoose' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'VelVoxelRaptor' },
	{ roles: [Reasons.BetaTester], name: '_JeffWooden' },
	{
		roles: [Reasons.BetaTester, Reasons.PatreonT3],
		name: 'CubeDeveloper',
		active: true,
	},
	{ roles: [Reasons.BetaTester], name: 'destruc7i0n' },
	{ roles: [Reasons.PatreonT3], name: 'DoubleFelix', active: true },
	{ roles: [Reasons.BetaTester], name: 'Eriol_Eandur' },
	{ roles: [Reasons.BetaTester], name: 'gibbs' },
	{ roles: [Reasons.BetaTester], name: 'JayPeaSize' },
	{ roles: [Reasons.BetaTester], name: 'Kastle' },
	{ roles: [Reasons.BetaTester], name: 'Kyle10BC' },
	{ roles: [Reasons.BetaTester], name: 'Matt/Arwen' },
	{ roles: [Reasons.BetaTester], name: 'Nerdrope' },
	{ roles: [Reasons.BetaTester], name: 'Onnowhere' },
	{ roles: [Reasons.BetaTester], name: 'Sprunkles' },
	{ roles: [Reasons.BetaTester], name: 'Suso' },
	{ roles: [Reasons.BetaTester], name: 'taj' },
	{ roles: [Reasons.BetaTester], name: 'TheRedstoneer' },
	{ roles: [Reasons.BetaTester], name: 'Totigonzales' },
	{ roles: [Reasons.BetaTester], name: 'Violet' },
	{ roles: [Reasons.BetaTester], name: 'CommanderRedstone' },
	{ roles: [Reasons.Translator], name: 'brooke-zb' },
	{ roles: [Reasons.Translator], name: 'ououn' },
]
function Link({ href, children, ...props }) {
	return (
		<a
			href={href}
			{...props}
			onClick={(e) => {
				e.preventDefault()
				shell.openExternal(href)
			}}
		>
			{children}
		</a>
	)
}
function Center({ children }) {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
			}}
		>
			{children}
		</div>
	)
}
function About() {
	return (
		<div>
			<Center>
				<img
					src={logo}
					width={256}
					height={256}
					style={{
						borderRadius: '128px',
						border: '4px solid var(--color-border)',
					}}
				></img>
			</Center>
			<Center>
				<h1 style={{ fontSize: '3em' }}>{tl('animatedJava')}</h1>
			</Center>
			<Center>
				<p style={{ marginTop: '0.1em' }}>
					{process.env.PLUGIN_VERSION}
				</p>
			</Center>
			<Center>
				<Link
					className="open-in-browser"
					href={process.env.DISCORD_LINK}
					target="_blank"
					style={{
						margin: '0.5em',
						fontSize: '2em',
						color: '#5865F2',
					}}
					title={tl('animatedJava.dialogs.about.discordServer')}
				>
					<i className="fab fa-discord"></i>
				</Link>
				<Link
					className="open-in-browser"
					href={process.env.GITHUB_LINK}
					target="_blank"
					style={{
						margin: '0.5em',
						fontSize: '2em',
						color: '#FFFFFF',
					}}
					title={tl('animatedJava.dialogs.about.githubRepo')}
				>
					<i className="fab fa-github"></i>
				</Link>
				<Link
					className="open-in-browser"
					href={process.env.PATREON_LINK}
					target="_blank"
					style={{
						margin: '0.5em',
						fontSize: '2em',
						color: '#FF424D',
					}}
					title={tl('animatedJava.dialogs.about.patron')}
				>
					<i className="fab fa-patron"></i>
				</Link>
			</Center>
			<hr />
			<Center>
				<div
					style={{
						whiteSpace: 'pre',
					}}
				>
					{tl('animatedJava.dialogs.about.description')}
				</div>
			</Center>
			<hr />
			<Center>
				<h1 style={{ marginTop: '1em', marginBottom: '0.3em' }}>
					{tl('animatedJava.dialogs.about.developers')}
				</h1>
			</Center>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					margin: '20px 14%',
					justifyContent: 'space-between',
					backgroundColor: 'var(--color-back)',
					borderRadius: '4px',
					padding: '3% 3%',
					border: '4px solid var(--color-border)',
				}}
			>
				<div>
					<img
						src={fetchbotpfp}
						width={128}
						height={128}
						style={{
							borderRadius: '128px',
							backgroundColor: 'var(--color-ui)',
							border: '4px solid var(--color-border)',
							display: 'block',
							marginLeft: 'auto',
							marginRight: 'auto',
						}}
					></img>
					<div style={{ textAlign: 'center' }}>
						<a
							href="https://twitter.com/FetchBot1"
							style={{ fontSize: '2em' }}
						>
							FetchBot
						</a>
					</div>
					<p style={{ textAlign: 'center', fontSize: '1em' }}>
						{tl('animatedJava.dialogs.about.fetchbotQuote')}
					</p>
				</div>
				<div>
					<img
						src={snavesutitpfp}
						width={128}
						height={128}
						style={{
							borderRadius: '128px',
							backgroundColor: 'var(--color-ui)',
							border: '4px solid var(--color-border)',
							justifyContent: 'center',
							display: 'block',
							marginLeft: 'auto',
							marginRight: 'auto',
						}}
					></img>
					<div style={{ textAlign: 'center' }}>
						<a
							href="https://twitter.com/SnaveSutit"
							style={{ fontSize: '2em' }}
						>
							SnaveSutit
						</a>
					</div>
					<p style={{ textAlign: 'center', fontSize: '1em' }}>
						{tl('animatedJava.dialogs.about.snavesutitQuote')}
					</p>
				</div>
			</div>
			<Center>
				<h1 style={{ marginTop: '1em', marginBottom: '0.8em' }}>
					{tl('animatedJava.dialogs.about.patrons')}
				</h1>
			</Center>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'space-evenly',
				}}
			>
				{people
					.filter((person) => {
						return (
							person.roles.includes(Reasons.PatreonT1) ||
							person.roles.includes(Reasons.PatreonT2) ||
							person.roles.includes(Reasons.PatreonT3)
						)
					})
					.map((person) => (
						<Person key={person.name} person={person} />
					))}
			</div>

			<Center>
				<h1 style={{ marginTop: '1em', marginBottom: '0.8em' }}>
					{tl('animatedJava.dialogs.about.honourableMentions')}
				</h1>
			</Center>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'space-evenly',
				}}
			>
				{people
					.filter((person) => {
						return !(
							person.roles.includes(Reasons.PatreonT1) ||
							person.roles.includes(Reasons.PatreonT2) ||
							person.roles.includes(Reasons.PatreonT3)
						)
					})
					.map((person) => (
						<Person key={person.name} person={person} />
					))}
			</div>
			<p>
				<b>{tl('animatedJava.dialogs.about.buildID')}</b>{' '}
				{process.env.BUILD_ID}
			</p>
		</div>
	)
}
export function show_about() {
	new Dialog({
		id: 'animatedJava.about',
		// width: 1024,
		title: tl('animatedJava.dialogs.about.title'),
		// lines: [format(tl('animatedJava.dialogs.about.body'), {
		// 	version: process.env.PLUGIN_VERSION,
		// 	buildID: process.env.BUILD_ID
		// })],
		lines: [`<div id="animated_java_about"></div>`],
		//@ts-ignore
		width: 900,
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
