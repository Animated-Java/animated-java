import type * as aj from './animatedJava'

interface BoneConfig {
	nbt: string
}

type VariantModel = {
	aj: {
		customModelData: number
	}
	parent: string
	textures: aj.TextureObject
}

interface VariantModels {
	[modelName: string]: VariantModel
}

interface VariantTextureOverrides {
	[modelName: string]: {
		textures: aj.TextureObject
	}
}

interface VariantTouchedModels {
	[modelName: string]: aj.Model
}

export class Variant {
	textureMap: { [uuid: string]: string }
	boneConfigs: { [uuid: string]: BoneConfig }

	// Exporter Data
	models?: VariantModels
	touchedModels?: VariantTouchedModels
	textureOverrides?: VariantTextureOverrides

	constructor() {
		this.textureMap = {}
		this.boneConfigs = {}
	}

	validate() {
		const missingTextures = []
		const missingBones = []
		for (const [origin, replacer] of Object.entries(this.textureMap)) {
			if (!Texture.all.find(v => v.uuid == origin)) missingTextures.push(origin)
			if (!Texture.all.find(v => v.uuid == replacer)) missingTextures.push(replacer)
		}
		for (const [bone, _] of Object.entries(this.boneConfigs)) {
			if (!Group.all.find(v => v.uuid == bone)) missingBones.push(bone)
		}
		if (missingBones.length && missingTextures.length) return { missingBones, missingTextures }
	}

	clearOldExportData() {
		this.models = {}
		this.touchedModels = {}
		this.textureOverrides = {}
	}

	toJSON() {
		return {
			textureMap: this.textureMap,
			boneConfigs: this.boneConfigs,
		}
	}

	static fromJSON(json: any) {
		const v = new Variant()
		v.textureMap = json.textureMap
		v.boneConfigs = json.boneConfigs
		return v
	}
}
