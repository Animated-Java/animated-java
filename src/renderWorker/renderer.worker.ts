import * as DataTypes from './renderer.worker.types'

export default async function (data: DataTypes.Data): Promise<DataTypes.Result> {
	console.log({ data })
	return data
}
