import { Compiler, Parser, Tokenizer, SyncIo } from 'mc-build'
import { VariableMap } from 'mc-build/dist/mcl/Compiler'
import { isFunctionTagPath } from '../util/fileUtil'
import { Scoreboard, generateScoreboard } from './datapackCompiler/scoreboards'

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

	generateScoreboard()

	generateAnimatedJavaMCBFile(compiler)
	generateBlueprintMCBFile(compiler)

	compiler.compile(new VariableMap(null))
}

function generateAnimatedJavaMCBFile(compiler: Compiler): void {
	const mcbFile: string[] = []

	const namespace = Project!.animated_java.export_namespace

	const filePath = `src/animated_java.mcb`
	compiler.addFile(
		filePath,
		Parser.parseMcbFile(Tokenizer.tokenize(mcbFile.join('\n'), filePath))
	)
}

function generateBlueprintMCBFile(compiler: Compiler): void {
	const mcbFile: string[] = []

	const exportVersionID = Math.round(Math.random() * 2147483647)
	const namespace = Project!.animated_java.export_namespace

	const filePath = `src/${Project!.animated_java.export_namespace}.mcb`
	compiler.addFile(
		filePath,
		Parser.parseMcbFile(Tokenizer.tokenize(mcbFile.join('\n'), filePath))
	)
}
