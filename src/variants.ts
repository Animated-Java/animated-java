interface BoneConfig {
	nbt: string
}

class Variant {
	textureMap: { [uuid: string]: string }
	boneConfigs: { [uuid: string]: BoneConfig }
	constructor() {
		this.textureMap = {}
		this.boneConfigs = {}
	}

	toJSON() {
		return {
			textureMap: this.textureMap,
			boneConfigs: this.boneConfigs
		}
	}

	static fromJSON(json: any) {
		const v = new Variant()
		v.textureMap = json.textureMap
		v.boneConfigs = json.boneConfigs
		return v
	}
}
