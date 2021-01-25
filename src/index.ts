import path from 'path'
import { merge as _merge, get as _get, set as _set } from 'lodash'
import { iReader } from './readers'

type pojo = { [key: string]: unknown }

export interface iConfigLogger {
    info(message?: any, ...optionalParams: any[]): void
    debug(message?: any, ...optionalParams: any[]): void
}

export interface iConfig {
    load(configDirectory: string, scenarioNames: string[]): Promise<void>
    get(path: string): unknown
}

export class Config implements iConfig {
    constructor(public readonly logger: iConfigLogger = console) {}

    public async load(configDirectory: string, scenarioNames: string[] = []): Promise<void> {
        if (this.isLoading) {
            throw new Error('"Load()" method cannot be called until the previous call resolved!')
        }
        this.isLoading = true
        try {
            const scenarioFilenames = scenarioNames.map((name) => path.resolve(configDirectory, name))
            const scenarios = await Promise.all(
                scenarioFilenames.map(async (filename) =>
                    import(filename).then((module) => {
                        const scenario = module.default
                        this.logger.debug(`${filename} scenario is loaded: `, scenario)
                        return scenario
                    }),
                ),
            )

            this.config = _merge({}, ...scenarios)
            this.logger.debug('Config scenario is: ', this.config)

            this.compile()
            await Promise.all(this.pendingAsyncNodes)
            this.logger.debug(`Configuration compiled`, this.config)
        } finally {
            this.isLoading = false
        }
    }

    public get(path: string) {
        if (this.isLoading) {
            throw new Error('Using "get()" method is not allowed until the configuration is fully loaded.')
        }
        return _get(this.config, path)
    }

    private getUnsafe(path: string): unknown | Promise<unknown> {
        const node = _get(this.config, path)
        if (typeof node === 'function') {
            this.invokeReader(path, node as iReader)
        }
        return _get(this.config, path)
    }

    private pendingAsyncNodes: Promise<unknown>[] = []
    private isLoading = false
    private config: pojo = {}

    private compile(configSubtree = this.config, pathPrefix = ''): void {
        Object.entries(configSubtree).forEach(([nodeName, node]) => {
            const path = pathPrefix ? `${pathPrefix}.${nodeName}` : nodeName
            if (typeof node === 'function') {
                this.invokeReader(path, node as iReader)
            }
            if (Array.isArray(node)) {
                return
            }
            if (typeof node === 'object' && node !== null) {
                this.compile(node as pojo, path)
            }
        })
    }

    private invokeReader(path: string, reader: iReader): void {
        const pendingValue = reader(path, this.logger, this.getUnsafe.bind(this)).then((value) => {
            _set(this.config, path, value)
            return value
        })
        _set(this.config, path, pendingValue)
        this.pendingAsyncNodes.push(pendingValue)
    }
}
