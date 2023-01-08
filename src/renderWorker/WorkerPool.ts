interface PoolItem<T> {
	available: boolean
	target: T | null
}
type TupleRest<T extends readonly any[]> = ((...t: T) => any) extends (a: any, ...r: infer R) => any ? R : never
export class Pool<WorkerType extends Worker, TaskFn extends (item: WorkerType, ...args: any[]) => Promise<any>> {
	private pool: PoolItem<WorkerType>[]
	private tasks: Set<Promise<ReturnType<TaskFn>> | null>
	constructor(size: number, private factory: () => WorkerType, private task: TaskFn) {
		this.pool = Array.from(Array(size), () => ({ available: true, target: null }))
		this.tasks = new Set()
	}
	async get(): Promise<PoolItem<WorkerType>> {
		let item: PoolItem<WorkerType> | undefined = this.pool.find(item => item.available)
		if (item) {
			return item
		}
		while (true) {
			await Promise.any(this.tasks.values())
			item = this.pool.find(item => item.available)
			if (item) {
				return item
			}
		}
	}
	mark(item: PoolItem<WorkerType>, available: boolean) {
		item.available = available
	}
	async run(...args: TupleRest<Parameters<TaskFn>>): Promise<ReturnType<TaskFn>> {
		let item = await this.get()
		this.mark(item, false)
		if (!item.target) {
			item.target = this.factory()
		}
		let resultPromise: Promise<ReturnType<TaskFn>> | null = null
		try {
			resultPromise = this.task(item.target!, ...args)
			this.tasks.add(resultPromise)
			let returnValue = await resultPromise
			this.mark(item, true)
			this.tasks.delete(resultPromise)
			return returnValue
		} catch (e) {
			this.mark(item, true)
			item.target?.terminate()
			this.tasks.delete(resultPromise)
			item.target = null
			throw e
		}
	}
	terminate() {
		this.pool.forEach(item => {
			if (item.target) item.target.terminate()
			item.target = null
		})
	}
}
