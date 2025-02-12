import { PACKAGE } from '../../../constants'
import { SvelteDialog } from '../../../util/svelteDialog'
import { translate } from '../../../util/translation'
import UnexpectedErrorDialog from './unexpectedErrorDialog.svelte'

export const flavorQuotes = [
	`Uh oh!`,
	`Time to fire up the ol' debugger!`,
	`Your item displays are sad 🥺`,
	`Ok, who pushed the big <span style="color: var(--color-error)">red</span> button?`,
	`Skill Issue.`,
	`You have how many elements!?`,
	`I'll export successfully some day!`,
	`When I grow up, I wanna be just like Blender!`,
	`Should'a seen that one comming...`,
	`It's all Jannis' fault! :(`,
	`Snaviewavie did an oopsie poopsie x3`,
	`We to a little trolling`,
	`execute run execute run execute run execute run say This is fine.`,
	`This is why we can't have nice things. :(`,
	`Have you tried turning it off and on again?`,
	`What if I put my command block next to yours? Haha just kidding... Unless?`,
	`If at first you don't succeed, Try, try again!`,
	`B:01010111 01100101 00100000 01100100 01101111 00100000 01100001 00100000 01101100 01101001 01110100 01110100 01101100 01100101 00100000 01110100 01110010 01101111 01101100 01101100 01101001 01101110 01100111`,
	`<div style="display: flex; flex-direction: column; padding: 16px;">
			<p>SnaveSutit would like to know your location</p>
			<div style="display: flex; flex-direction: row; align-items: center; justify-content: center;">
				<button style="font-size: 1rem; margin: 0px 4px;">Allow</button>
				<button style="font-size: 1rem; margin: 0px 4px;">Deny</button>
			</div>
		</div>`,
	`I've decided to stop working for today. Try again tomorrow!`,
	`Every time you see this error message, a developer vanishes in a puff of binary.`,
	`"Flavor Text"? I've never tasted text before...`,
	`( ͡° ͜ʖ ͡°)`,
	`That's a nice model you have there, it'd be a shame if something were to happen to it...`,
	`Some day you'll learn. But until then, I control the cheese`,
	`Please deposit 5 coins!`,
	`<a href="https://youtu.be/dQw4w9WgXcQ">Click here to find a solution!</a>`,
	`<img src="https://i.kym-cdn.com/photos/images/original/000/296/199/9ff.gif" alt="roflcopter">`,
	`Failed to find global 'pandemic'`,
]

export function openUnexpectedErrorDialog(error: Error) {
	new SvelteDialog({
		id: `${PACKAGE.name}:unexpectedError`,
		title: translate('dialog.unexpected_error.title'),
		width: 600,
		component: UnexpectedErrorDialog,
		props: {
			error,
		},
		preventKeybinds: true,
		buttons: [translate('dialog.unexpected_error.close_button')],
	}).show()
}
