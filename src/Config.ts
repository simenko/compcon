import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import { Compiler } from './Compiler'
import { ConfigLoader } from './ConfigLoader'
import { get, has } from './utils'

export type POJO = { [key: string]: unknown }

export interface iConfigLogger {
    info(message?: unknown, ...optionalParams: unknown[]): void
    debug(message?: unknown, ...optionalParams: unknown[]): void
}

export interface iConfigValidator {
    (config: POJO): POJO
}

export class Config extends EventEmitter {
    private scenario: POJO = {}
    private config: POJO = {}
    private constructor(
        private readonly logger: iConfigLogger = console,
        private readonly loader: ConfigLoader,
        private readonly compiler: Compiler,
    ) {
        super()
    }

    public static init(logger: iConfigLogger = console, loader?: ConfigLoader, compiler?: Compiler) {
        return currentConfig || new Config(logger, loader || new ConfigLoader(logger), compiler || new Compiler(logger))
    }

    public async create(layers: (string | POJO)[] = [], configDirectory: string = '', amend = false): Promise<void> {
        const start = performance.now()
        this.scenario = await this.loader.load(layers, configDirectory, amend)
        const loaded = performance.now()
        this.logger.debug(`Config scenario loaded in: ${loaded - start} ms: `, this.scenario)

        this.config = await this.compiler.compile(this.scenario)
        this.emit('load')
        this.logger.debug(`Configuration compiled in ${(performance.now() - loaded).toPrecision(6)} ms: `, this.config)
    }

    public async update(layers: (string | POJO)[] = [], configDirectory: string = ''): Promise<void> {
        return this.create(layers, configDirectory, true)
    }

    public get(path?: string) {
        get(this.config, path)
    }

    public has(path: string) {
        return has(this.config, path)
    }
}

let currentConfig: Config
