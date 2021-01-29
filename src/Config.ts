import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import { get as _get, has as _has } from 'lodash'
import { Compiler } from './Compiler'
import { ConfigLoader } from './ConfigLoader'

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
    constructor(
        private readonly logger: iConfigLogger = console,
        private readonly loader: ConfigLoader = new ConfigLoader(logger),
        private readonly compiler: Compiler = new Compiler(logger),
    ) {
        super()
    }

    public async load(layers: (string | POJO)[] = [], configDirectory: string = '', amend = false): Promise<void> {
        const start = performance.now()
        this.scenario = await this.loader.load(layers, configDirectory, amend)
        const loaded = performance.now()
        this.logger.debug(`Config scenario loaded in: ${loaded - start} ms: `, this.scenario)

        this.config = await this.compiler.compile(this.scenario)
        this.emit('load')
        this.logger.debug(`Configuration compiled in ${(performance.now() - loaded).toPrecision(6)} ms: `, this.config)
    }

    public get(path: string = '') {
        if (!this.has(path)) {
            throw new Error(`Could not find path ${path} in the config`)
        }
        return path ? _get(this.config, path) : this.config
    }

    public has(path: string) {
        return !path || _has(this.config, path)
    }
}
