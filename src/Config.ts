import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import Compiler, { iCompile } from './Compiler'
import Loader, { iLoad } from './Loader'
import { clone, deepFreeze, get, has } from './utils'
import { ConfigurationError, ErrorCodes } from './errors'

export type POJO = Record<string, unknown>
export type classTransformer<T> = (rawConfig: POJO) => T
export type validator<T = POJO> = (config: T) => void

export interface iConfigLogger {
    info(message?: unknown, ...optionalParams: unknown[]): void
    debug(message?: unknown, ...optionalParams: unknown[]): void
}

export interface iConfigOptions<T> {
    logger?: iConfigLogger
    load?: iLoad
    compile?: iCompile
    validate?: validator<T>
}

let isInitialized = false

/* eslint-disable no-redeclare */
function init<T>(transform: classTransformer<T>, options?: iConfigOptions<T>): TypedConfig<T>
function init(options?: iConfigOptions<POJO>): Config
function init<T>(
    transformerOrOptions?: classTransformer<T> | iConfigOptions<T>,
    options: iConfigOptions<T> = {},
): TypedConfig<T> | Config {
    /* eslint-enable no-redeclare */

    if (isInitialized) {
        throw new ConfigurationError(ErrorCodes.INITIALIZATION_ERROR, 'The configuration can only be initialized once')
    }

    let transform
    if (typeof transformerOrOptions === 'function') {
        transform = transformerOrOptions as classTransformer<T>
    } else {
        options = (transformerOrOptions || options) as iConfigOptions<T>
    }

    const { logger = console, load = Loader(logger), compile = Compiler(logger), validate } = options

    isInitialized = true
    return transform
        ? new TypedConfig<T>(transform, logger, load, compile, validate)
        : new Config(logger, load, compile, validate as validator<POJO>)
}

export default init

abstract class BaseConfig<T> extends EventEmitter {
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

    public async create(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<void> {
        return this.build(layers, configDirectory)
    }

    public async update(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<void> {
        return this.build([clone(this.scenario), ...layers], configDirectory)
    }

    private async build(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<void> {
        const enqueued = performance.now()
        const dequeue = await this.enqueueBuild()
        const started = performance.now()
        this.logger.debug(`Time spent in queue: ${(started - enqueued).toPrecision(6)} ms. `)

        const scenario = await this.load(layers, configDirectory)
        const loaded = performance.now()
        this.logger.debug(`Config scenario loaded in: ${(loaded - started).toPrecision(6)} ms: `, scenario)

        const rawConfig = await this.compile(scenario)
        const transformedConfig = this.transform(rawConfig)
        this.validate && this.validate(transformedConfig)
        deepFreeze(transformedConfig as POJO)
        this.scenario = scenario
        this.config = transformedConfig
        this.emit('configurationChanged')
        const finished = performance.now()
        this.logger.debug(
            `Configuration compiled in ${(finished - loaded).toPrecision(6)} ms. Total build time is ${(
                finished - enqueued
            ).toPrecision(6)} ms.\n`,
            this.config,
        )
        dequeue()
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

class TypedConfig<T> extends BaseConfig<T> {
    constructor(
        protected transform: classTransformer<T>,
        logger: iConfigLogger,
        load: iLoad,
        compile: iCompile,
        validate?: validator<T>,
    ) {
        super(logger, load, compile, validate)
    }

    public get(): T {
        return this.config
    }
}

class Config extends BaseConfig<POJO> {
    public get(path?: string): unknown {
        return get(this.config, path)
    }

    public has(path: string) {
        return has(this.config, path)
    }

    protected transform: classTransformer<POJO> = (rawConfig) => rawConfig
}
