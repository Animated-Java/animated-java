import { registerPropertyOverrideMod } from 'src/util/moddingTools'
import {
	closeBlueprintLoadingDialog,
	openBlueprintLoadingDialog,
	PROGRESS,
} from '../interface/popup/blueprintLoading'

registerPropertyOverrideMod({
	id: `animated-java:function-override/blockbench/read-async`,
	object: Blockbench,
	key: 'read',

	override: original => {
		return async function (
			files: Parameters<typeof Blockbench.read>['0'],
			options: Parameters<typeof Blockbench.read>['1'],
			cb: Parameters<typeof Blockbench.read>['2']
		) {
			for (const file of files) {
				original([file], options, cb)
				await new Promise<void>(resolve => {
					if (Project?.loadingPromises) {
						openBlueprintLoadingDialog()
						const promises: Array<Promise<unknown>> = []
						for (const promise of Project.loadingPromises) {
							promises.push(
								new Promise<void>(r => {
									promise
										.catch((err: any) => console.error(err))
										.finally(() => {
											PROGRESS.set(PROGRESS.get() + 1)
											r()
										})
								})
							)
						}
						void Promise.all(promises)
							.catch(err => {
								console.error('Failed to load project')
								console.error(err)
							})
							.finally(() => {
								closeBlueprintLoadingDialog()
								delete Project.loadingPromises
								resolve()
							})
						return
					}
					resolve()
				})
			}
		}
	},
})
