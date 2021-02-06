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

let currentConfig: unknown

/* eslint-disable no-redeclare */
function setup<T>(transform: classTransformer<T>, options?: iConfigOptions<T>): TypedConfig<T>
function setup(options?: iConfigOptions<POJO>): Config
function setup<T>(
    transformerOrOptions?: classTransformer<T> | iConfigOptions<T>,
    options: iConfigOptions<T> = {},
): TypedConfig<T> | Config {
    /* eslint-enable no-redeclare */

    let transform
    if (typeof transformerOrOptions === 'function') {
        transform = transformerOrOptions as classTransformer<T>
    } else {
        options = (transformerOrOptions || options) as iConfigOptions<T>
    }
    if (currentConfig) {
        if ((currentConfig instanceof Config && transform) || (currentConfig instanceof TypedConfig && !transform)) {
            throw new ConfigurationError(
                ErrorCodes.INITIALIZATION_ERROR,
                'You cannot switch between typed and untyped config after initialization',
            )
        }
        if (currentConfig instanceof Config) return currentConfig as Config
        if (currentConfig instanceof TypedConfig) return currentConfig as TypedConfig<T>
    }
    const { logger = console, load = Loader(logger), compile = Compiler(logger), validate } = options

    return transform
        ? new TypedConfig<T>(transform, logger, load, compile, validate)
        : new Config(logger, load, compile, validate as validator<POJO>)
}

export default setup

abstract class BaseConfig<T> extends EventEmitter {
    protected scenario: POJO = {}
    protected config!: T

    constructor(
        private readonly logger: iConfigLogger = console,
        private readonly load: iLoad,
        private readonly compile: iCompile,
        protected readonly validate?: validator<T>,
    ) {
        super()
    }

    public async create(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<void> {
        return this.build(layers, configDirectory)
    }

    public async update(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<void> {
        return this.build([clone(this.scenario), ...layers], configDirectory)
    }

    private async build(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<void> {
        const start = performance.now()
        const scenario = await this.load(layers, configDirectory)
        const loaded = performance.now()
        this.logger.debug(`Config scenario loaded in: ${loaded - start} ms: `, scenario)

        const rawConfig = await this.compile(scenario)
        const transformedConfig = this.transform(rawConfig)
        this.validate && this.validate(transformedConfig)
        deepFreeze(transformedConfig as POJO)
        this.scenario = scenario
        this.config = transformedConfig
        this.emit('configurationChanged')
        this.logger.debug(`Configuration compiled in ${(performance.now() - loaded).toPrecision(6)} ms: `, this.config)
    }

    protected abstract transform: classTransformer<T>
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
