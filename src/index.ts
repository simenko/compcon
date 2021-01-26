import path from 'path'
import { merge as _merge, get as _get, set as _set, cloneDeep as _cloneDeep, has as _has } from 'lodash'
import { iReader, iConfigGetter } from './readers'
import { readdir } from 'fs'
import { promisify } from 'util'
import { iLoader, ts, js, json } from './loaders'

export type POJO = { [key: string]: unknown }

export interface iConfigLogger {
    info(message?: any, ...optionalParams: any[]): void
    debug(message?: any, ...optionalParams: any[]): void
}

export interface iConfigValidator {
    (config: POJO): POJO
}

export interface iConfig {
    load(configDirectory: string, scenarios: (string | POJO)[], amend?: boolean): Promise<void>
    get(path?: string): unknown
    has(path: string): boolean
}

export class Config implements iConfig {
    constructor(
        private readonly logger: iConfigLogger = console,
        private readonly validate: iConfigValidator = (config) => config,
        private readonly loaders: iLoader[] = [json, js, ts],
    ) {}

    public async load(configDirectory: string, scenarios: (string | POJO)[] = [], amend = false): Promise<void> {
        let configDirFileList: string[]
        if (scenarios.some((scenario: string | POJO) => typeof scenario === 'string')) {
            configDirFileList = await promisify(readdir)(configDirectory)
        }
        const loadedScenarios = await Promise.all(
            scenarios.map(async (filenameOrSubtree) => {
                if (typeof filenameOrSubtree === 'object') {
                    return filenameOrSubtree
                }
                const scenarioFilenames = configDirFileList.filter(
                    (filename) => filename.replace(path.extname(filename), '') === filenameOrSubtree,
                )
                if (!scenarioFilenames.length) {
                    this.logger.debug(`Could not find scenario ${filenameOrSubtree}`)
                    return {}
                }
                const scenarioTypes = scenarioFilenames.map((filename) => path.extname(filename).replace('.', ''))
                const loader = this.loaders.find((loader) => scenarioTypes.includes(loader.name))
                if (!loader) {
                    throw new Error(`Could not find loader for any of the ${scenarioFilenames}`)
                }
                const scenarioPath = path.join(
                    configDirectory,
                    String(scenarioFilenames.find((filename) => filename.endsWith(`.${loader.name}`))),
                )
                const scenario = await loader(scenarioPath)
                this.logger.debug(`${scenarioPath} scenario is loaded: `, scenario)
                return scenario
            }),
        )

        this.scenario = _merge(amend ? this.scenario : {}, ...loadedScenarios)
        this.logger.debug('Config scenario is: ', this.scenario)

        this.config = this.validate(await compile(this.scenario, this.logger))
        this.logger.debug(`Configuration compiled: `, this.config)
    }

    public get(path: string = '') {
        if (!this.config) {
            throw new Error('Using "get()" method is not allowed until the configuration is fully loaded.')
        }
        if (!this.has(path)) {
            throw new Error(`Could not find path ${path} in the config`)
        }
        return path ? _get(this.config, path) : this.config
    }

    public has(path: string) {
        return !path || _has(this.config, path)
    }

    private scenario: POJO = {}
    private config: POJO = {}
}

async function compile(scenario: POJO, logger: iConfigLogger): Promise<POJO> {
    const config = _cloneDeep(scenario)
    const pendingAsyncNodes: Promise<unknown>[] = []
    const freezingRefs: POJO[] = [config]

    function traverse(configSubtree: POJO, pathPrefix = ''): void {
        Object.entries(configSubtree).forEach(([nodeName, node]) => {
            const path = pathPrefix ? `${pathPrefix}.${nodeName}` : nodeName
            if (typeof node === 'function') {
                invokeReader(path, node as iReader)
            }
            if (Array.isArray(node)) {
                return
            }
            if (typeof node === 'object' && node !== null) {
                traverse(node as POJO, path)
                freezingRefs.push(node as POJO)
            }
        })
    }

    function invokeReader(path: string, reader: iReader): void {
        const pendingValue = reader(path, logger, get).then((value) => {
            _set(config, path, value)
            return value
        })
        _set(config, path, pendingValue)
        pendingAsyncNodes.push(pendingValue)
    }

    const get: iConfigGetter = async function (path: string) {
        const node = _get(config, path)
        if (typeof node === 'function') {
            invokeReader(path, node as iReader)
        }
        return _get(config, path)
    }

    traverse(config)
    await Promise.all(pendingAsyncNodes)
    freezingRefs.forEach((node) => Object.freeze(node))
    return config
}
