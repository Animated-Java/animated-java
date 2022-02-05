import { CustomError } from '../customError'

export class Entities {
	static entities = []

	static isEntity(name: string) {
		return Entities.entities.includes(name)
	}
}

const gotten = localStorage.getItem('animated-java<minecraftEntityList>')

let lsItem = { values: [] }
try {
	lsItem = JSON.parse(gotten)
	Entities.entities = lsItem.values
} catch (e) {
	lsItem = { values: [] }
}

const maxFails = 2
let fails = 0

function queryEntities() {
	function end() {
		throw new CustomError(
			'Unable to fetch minecraft item list, and item list not defined in local storage.'
		)
	}

	fetch(
		'https://raw.githubusercontent.com/Arcensoth/mcdata/master/processed/reports/registries/entity_type/data.json'
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
							'Successfully Collected Entity List:',
							json.values
						)
						Entities.entities = json.values
						localStorage.setItem(
							'animated-java<minecraftEntityList>',
							JSON.stringify(json)
						)
						return
					}
				}
				fails += 1
				if (fails <= maxFails) {
					setTimeout(queryEntities, 1000)
				} else if (!lsItem.values.length) {
					end()
				}
			},
			(e) => {
				fails += 1
				if (fails <= maxFails) {
					setTimeout(queryEntities, 1000)
				} else if (lsItem.values.length) {
					Entities.entities = lsItem.values
				} else {
					end()
				}
			}
		)
}

queryEntities()
