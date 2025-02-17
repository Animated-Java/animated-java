import { PACKAGE } from '@aj/constants'
import { createBlockbenchMod } from '@aj/util/moddingTools'

/**
 * Makes the text in panel titles clip instead of wrapping
 */
createBlockbenchMod(
	`${PACKAGE.name}:panelTitleTextWrap`,
	{
		css: undefined as Deletable | undefined,
	},
	ctx => {
		ctx.css = Blockbench.addCSS(`
		.panel_handle label {
			text-overflow: ellipsis;
			text-wrap-mode: nowrap;
		}
		`)
		return ctx
	},
	ctx => {
		ctx.css?.delete()
	}
)
