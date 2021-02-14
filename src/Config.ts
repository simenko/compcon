import { bool, Compiler, conventional, iCompile, json, num } from './Compiler'
import { iLoad, js, json as jsonFileLoader, Loader, ts } from './Loader'
import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import { clone, deepFreeze } from './utils'
import { Codes, ConfigurationError } from './ConfigurationError'
import { iReader } from './Compiler/readers'

export type tree<LeafType> = { [key: string]: LeafType | tree<LeafType> }
export type configLeaf = string | number | boolean | null | configLeaf[]
export type scenarioLeaf = configLeaf | iReader
export type configTree = tree<configLeaf>
export type scenarioTree = tree<scenarioLeaf>
export type configValue = configLeaf | configTree
export type scenarioValue = scenarioLeaf | scenarioTree

export type classTransformer<T> = (rawConfig: configTree) => T
export type validator<T> = (config: T) => void

export interface iConfigLogger {
    info(message?: unknown, ...optionalParams: unknown[]): void
    debug(message?: unknown, ...optionalParams: unknown[]): void
}
export interface iConfigOptions<T> {
    logger?: iConfigLogger
    load?: iLoad
    compile?: iCompile
    transform: classTransformer<T>
    validate: validator<T>
}

export class Config<T = configTree> extends EventEmitter {
    constructor(options: iConfigOptions<T>) {
        super()
        this.logger = options.logger ?? console
        this.load = options.load ?? Loader(this.logger, [jsonFileLoader, js, ts])
        this.compile = options.compile ?? Compiler(this.logger, conventional, [json, bool, num])
        this.transform = options.transform
        this.validate = options.validate
    }

    private readonly logger!: iConfigLogger
    private readonly load!: iLoad
    private readonly compile!: iCompile
    private readonly transform!: classTransformer<T>
    private readonly validate!: validator<T>
    protected scenario: scenarioTree = {}
    protected config!: T
    private buildId = 0
    private buildQueue: Record<number, Promise<void>> = {}

    public async create(layers: (string | scenarioTree)[], configDirectory?: string): Promise<this> {
        return this.build(layers, configDirectory)
    }

    public async update(layers: (string | scenarioTree)[], configDirectory?: string): Promise<this> {
        return this.build([clone(this.scenario), ...layers], configDirectory)
    }

    private async build(layers: (string | scenarioTree)[] = [], configDirectory: string = ''): Promise<this> {
        const enqueued = performance.now()
        const dequeue = await this.enqueueBuild()
        const started = performance.now()
        this.logger.debug(`Time spent in queue: ${(started - enqueued).toPrecision(6)} ms.`)

        const scenario = await this.load(layers, configDirectory)
        const loaded = performance.now()
        this.logger.debug(`Config scenario loaded in: ${(loaded - started).toPrecision(6)} ms: \n`, scenario)

        const rawConfig = await this.compile(scenario)
        const transformedConfig = this.transform(rawConfig)
        try {
            this.validate(transformedConfig)
        } catch (e) {
            throw new ConfigurationError(Codes.VALIDATION_ERROR, e, `Config validation failed: ${e.message}`)
        }
        deepFreeze(transformedConfig)
        this.scenario = scenario
        this.config = transformedConfig

        this.emit('configurationChanged', this)
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
        let resolver: (v?: undefined) => void
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
