import { CustomError } from '../customError'

export class Items {
	static items = []

	static isItem(name: string) {
		return Items.items.includes(name)
	}
}

const gotten = localStorage.getItem('animated-java<minecraftItemList>')

let lsItem = {values:[]}
try {
	lsItem = JSON.parse(gotten)
	Items.items = lsItem.values
} catch (e) {
	lsItem = {values:[]}
}

const maxFails = 2
let fails = 0

function queryItems() {
	function end() {
		throw new CustomError(
			'Unable to fetch minecraft item list, and item list not defined in local storage.'
		)
	}

	fetch(
		'https://raw.githubusercontent.com/Arcensoth/mcdata/master/processed/reports/registries/item/data.json'
	)
		.catch((e) => {
			console.error(e)
		})
		.then(
			async (response) => {
				if (response) {
					const json = await response.json()
					if (json) {
						console.log(
							'Successfully Collected Item List:',
							json.values
						)
						Items.items = json.values
						localStorage.setItem(
							'animated-java<minecraftItemList>',
							JSON.stringify(json)
						)
						return
					}
				}
				fails += 1
				if (fails <= maxFails) {
					setTimeout(queryItems, 1000)
				} else if (!lsItem.values.length) {
					end()
				}
			},
			(e) => {
				fails += 1
				if (fails <= maxFails) {
					setTimeout(queryItems, 1000)
				} else if (lsItem.values.length) {
					Items.items = lsItem.values
				} else {
					end()
				}
			}
		)
}

queryItems()
