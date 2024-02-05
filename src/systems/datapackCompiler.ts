import { Compiler, Parser, Tokenizer, SyncIo } from 'mc-build'
import { VariableMap } from 'mc-build/dist/mcl/Compiler'
import { isFunctionTagPath } from '../util/fileUtil'

function createCustomSyncIO(): SyncIo {
	const io = new SyncIo()

	io.write = (localPath, content) => {
		const writePath = PathModule.join(Project!.animated_java.data_pack, localPath)

		if (isFunctionTagPath(writePath)) {
			console.log(`Function tag merging not implemented yet.`)
		}

		console.log(`Writing to ${writePath}: ${content}`)
	}

	return io
}

export function compileDataPack() {
	console.log('Compiling Data Pack...')
	const compiler = new Compiler('src/')
	compiler.io = createCustomSyncIO()

	generateBlueprintMCBFile(compiler)

	compiler.compile(new VariableMap(null))
}

function generateBlueprintMCBFile(compiler: Compiler): void {
	const mcbFile: string[] = []

	mcbFile.push(`function test {
		# This is a test function
		say Hello World!
	}`)

	mcbFile.push(`function my_load load {
		# This is a load function
		say Loading...
	}`)

	mcbFile.push(`function my_tick tick {
		# This is a tick function
		say Ticking...
	}`)

	const filePath = `src/${Project!.animated_java.export_namespace}.mcb`
	compiler.addFile(
		filePath,
		Parser.parseMcbFile(Tokenizer.tokenize(mcbFile.join('\n'), filePath))
	)
}
