import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import { iCompile } from './Compiler/Compiler'
import { iLoad } from './Loader/Loader'
import { clone, deepFreeze } from './utils'

export type POJO = Record<string, unknown>
export type classTransformer<T> = (rawConfig: POJO) => T
export type validator<T = POJO> = (config: T) => void

export interface iConfigLogger {
    info(message?: unknown, ...optionalParams: unknown[]): void
    debug(message?: unknown, ...optionalParams: unknown[]): void
}

export abstract class BaseConfig<T> extends EventEmitter {
    protected scenario: POJO = {}
    protected config!: T
    private buildId = 0
    private buildQueue: Record<number, Promise<unknown>> = {}

    constructor(
        private readonly logger: iConfigLogger = console,
        private readonly load: iLoad,
        private readonly compile: iCompile,
        protected readonly validate?: validator<T>,
    ) {
        super()
    }

    protected abstract transform: classTransformer<T>

    public async create(layers: (string | POJO)[], configDirectory?: string): Promise<this> {
        return this.build(layers, configDirectory)
    }

    public async update(layers: (string | POJO)[], configDirectory?: string): Promise<this> {
        return this.build([clone(this.scenario), ...layers], configDirectory)
    }

    private async build(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<this> {
        const enqueued = performance.now()
        const dequeue = await this.enqueueBuild()
        const started = performance.now()
        this.logger.debug(`Time spent in queue: ${(started - enqueued).toPrecision(6)} ms.`)

        const scenario = await this.load(layers, configDirectory)
        const loaded = performance.now()
        this.logger.debug(`Config scenario loaded in: ${(loaded - started).toPrecision(6)} ms: \n`, scenario)

        const rawConfig = await this.compile(scenario)
        const transformedConfig = this.transform(rawConfig)
        this.validate && this.validate(transformedConfig)
        deepFreeze(transformedConfig as POJO)
        this.scenario = scenario
        this.config = transformedConfig

        this.emit('configurationChanged')
        const finished = performance.now()
        dequeue()
        this.logger.debug(
            `Configuration compiled in ${(finished - loaded).toPrecision(6)} ms. Total build time is ${(
                finished - enqueued
            ).toPrecision(6)} ms.\n`,
            this.config,
        )
        return this
    }

    private async enqueueBuild() {
        const previousBuilds = Object.values(this.buildQueue)

        this.buildId++
        let resolver: (v?: unknown) => void
        this.buildQueue[this.buildId] = new Promise((resolve) => {
            resolver = resolve
        })

        await Promise.all(previousBuilds)
        return () => {
            delete this.buildQueue[this.buildId]
            resolver()
        }
    }
}
