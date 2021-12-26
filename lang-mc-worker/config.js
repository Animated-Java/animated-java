const _default = {
	dev: true,
	header: '#built using mc-build (https://github.com/mc-build/mc-build)',
	internalScoreboard: 'LANG_MC_INTERNAL',
	generatedDirectory: '__generated__',
	rootNamespace: null,
	defaultNamespace: null,
}

class Config {
	constructor() {
		this.data = _default
	}

	get dev() {
		return this.data.dev
	}
	set dev(v) {
		this.data.dev = v
	}

	get header() {
		return this.data.header
	}
	set header(v) {
		this.data.header = v
	}

	get internalScoreboard() {
		return this.data.internalScoreboard
	}
	set internalScoreboard(v) {
		this.data.internalScoreboard = v
	}

	get generatedDirectory() {
		return this.data.generatedDirectory
	}
	set generatedDirectory(v) {
		this.data.generatedDirectory = v
	}

	get rootNamespace() {
		return this.data.rootNamespace
	}
	set rootNamespace(v) {
		this.data.rootNamespace = v
	}

	get defaultNamespace() {
		return this.data.defaultNamespace
	}
	set defaultNamespace(v) {
		this.data.defaultNamespace = v
	}
}

const config = new Config()

export default config
