import { PACKAGE } from '../constants'
import {
	closeBlueprintLoadingDialog,
	openBlueprintLoadingDialog,
	PROGRESS,
} from '../interface/popup/blueprintLoading'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:blockbenchReadMod`,
	{
		original: Blockbench.read,
	},
	context => {
		async function asyncRead(
			files: Parameters<typeof Blockbench.read>['0'],
			options: Parameters<typeof Blockbench.read>['1'],
			cb: Parameters<typeof Blockbench.read>['2']
		) {
			for (const file of files) {
				context.original([file], options, cb)
				await new Promise<void>(r => {
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
								r()
							})
						return
					}
					r()
				})
			}
		}

		Blockbench.read = function (files, options, cb) {
			void asyncRead(files, options, cb).catch(console.error)
		}
		return context
	},
	context => {
		Blockbench.read = context.original
	}
)
