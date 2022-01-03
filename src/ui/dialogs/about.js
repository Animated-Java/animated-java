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
}
const roles = {
	[Reasons.BetaTester]: {
		get content() {
			return tl('about.closedBeta.content')
		},
		color: '#9B59B6',
		textColor: 'black',
	},
	[Reasons.Moderator]: {
		get content() {
			return tl('about.moderator.content')
		},
		color: '#ffb11f',
		textColor: 'black',
	},
	[Reasons.Contributor]: {
		get content() {
			return tl('about.contributor.content')
		},
		color: '#00aced',
		textColor: 'black',
	},
	[Reasons.BrandingArtist]: {
		get content() {
			return tl('about.brandingArtist.content')
		},
		color: '#00aced',
		textColor: 'black',
	},
	[Reasons.Youtuber]: {
		get content() {
			return tl('about.youtuber.content')
		},
		color: '#FF0000',
		textColor: 'white',
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
				}}
			>
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
		roles: [Reasons.BetaTester, Reasons.Moderator, Reasons.Contributor],
		name: 'Ancientkingg',
	},
	{ roles: [Reasons.BetaTester, Reasons.Moderator], name: 'dragonmaster95' },
	{ roles: [Reasons.BetaTester, Reasons.Moderator], name: 'Ersatz' },
	{
		roles: [Reasons.BetaTester, Reasons.Moderator, Reasons.BrandingArtist],
		name: 'YokaiS',
	},
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'CommandWitchery' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'MrMakistein' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'Flubberschnub' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'legitimoose' },
	{ roles: [Reasons.BetaTester, Reasons.Youtuber], name: 'VelVoxelRaptor' },
	{ roles: [Reasons.BetaTester], name: '_JeffWooden' },
	{ roles: [Reasons.BetaTester], name: 'destruc7i0n' },
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
]
function Link({ href, children, ...props }) {
	return (
		<a
			href={'#'}
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
					title={tl('about.discordServer')}
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
					title={tl('about.githubRepo')}
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
					title={tl('about.patreon')}
				>
					<i className="fab fa-patreon"></i>
				</Link>
			</Center>
			<hr />
			<Center>
				<div
					style={{
						whiteSpace: 'pre',
					}}
				>
					{tl('about.description')}
				</div>
			</Center>
			<hr />
			<Center>
				<h1 style={{ marginTop: '1em', marginBottom: '0.3em' }}>
					{tl('about.developers')}
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
						{tl('about.fetchbot.quote')}
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
						{tl('about.snavesutit.quote')}
					</p>
				</div>
			</div>
			<Center>
				<h1 style={{ marginTop: '1em', marginBottom: '0.8em' }}>
					{tl('about.honourableMentions')}
				</h1>
			</Center>
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
				<b>{tl('about.buildID')}</b> {process.env.BUILD_ID}
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
