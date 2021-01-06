import path from 'path'
import { merge, get, set } from 'lodash'
import { iWrappedReader, iReader, composite, iConfigReader } from './readers'

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
    constructor(readers: iReader[] = [], public readonly logger: iConfigLogger = console) {
        ;[composite, ...readers].forEach(
            (reader) =>
                (this.readerCreators[reader.name] = (...options: unknown[]) =>
                    Config.prepareReader(reader, ...options)),
        )
    }

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
                        const scenario = module.default(this.readerCreators)
                        this.logger.debug(`${filename} scenario is loaded: `, scenario)
                        return scenario
                    }),
                ),
            )

            this.config = merge({}, ...scenarios)
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
        return get(this.config, path)
    }

    private getUnsafe(path: string): unknown | Promise<unknown> {
        const node = get(this.config, path)
        if (typeof node === 'function') {
            this.read(path, node as iWrappedReader)
        }
        return get(this.config, path)
    }

    private pendingAsyncNodes: Promise<unknown>[] = []
    private isLoading = false
    private config: pojo = {}
    private readerCreators: { [key: string]: (...options: unknown[]) => iWrappedReader | iConfigReader } = {
        get: (...options: unknown[]) => {
            const boundGetUnsafe = this.getUnsafe.bind(this)
            return async function get(latePath: string) {
                return boundGetUnsafe((options[0] as string) || latePath)
            }
        },
    }

    private compile(configSubtree = this.config, pathPrefix = ''): void {
        Object.entries(configSubtree).forEach(([nodeName, node]) => {
            const path = pathPrefix ? `${pathPrefix}.${nodeName}` : nodeName
            if (typeof node === 'function') {
                this.read(path, node as iWrappedReader)
            }
            if (Array.isArray(node)) {
                return
            }
            if (typeof node === 'object' && node !== null) {
                this.compile(node as pojo, path)
            }
        })
    }

    private read(path: string, reader: iWrappedReader): void {
        const pendingValue = reader(path, this.logger, this.getUnsafe.bind(this)).then((value) => {
            set(this.config, path, value)
            return value
        })
        set(this.config, path, pendingValue)
        this.pendingAsyncNodes.push(pendingValue)
    }

    private static prepareReader(reader: iReader, ...options: unknown[]): iWrappedReader {
        const read: iWrappedReader = async function (path, logger, get: iConfigReader) {
            return Promise.resolve(reader(path, logger, get, ...options)).then((value) => {
                logger.debug(`Reader ${reader.name} has read ${value} at ${path}.`)
                return value
            })
        }
        Object.defineProperty(read, 'name', { value: reader.name })
        return read
    }
}
