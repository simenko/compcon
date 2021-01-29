import path from 'path'
import { readdir } from 'fs'
import { promisify } from 'util'
import { merge as _merge } from 'lodash'
import { iFileLoader, ts, js, json } from './fileLoaders'
import { POJO, iConfigLogger } from './Config'

export class ConfigLoader {
    private scenario: POJO = {}
    private configDirectory: string = ''
    private configDirFileList: string[] = []

    constructor(
        private readonly logger: iConfigLogger = console,
        private readonly fileLoaders: iFileLoader[] = [json, js, ts],
    ) {}

    public async load(layers: (string | POJO)[] = [], configDirectory: string = '', amend = false): Promise<POJO> {
        this.configDirectory = configDirectory
        if (this.configDirectory) {
            this.configDirFileList = await promisify(readdir)(this.configDirectory)
        }
        const loadedLayers = await Promise.all(
            layers.map(async (filenameOrSubtree) => this.loadLayer(filenameOrSubtree)),
        )
        this.scenario = _merge(amend ? this.scenario : {}, ...loadedLayers)
        this.logger.debug(`Config scenario loaded: `, this.scenario)
        return this.scenario
    }

    private async loadLayer(basenameOrSubtree: string | POJO) {
        if (typeof basenameOrSubtree === 'object') {
            return basenameOrSubtree
        }
        const layerFilenames = this.configDirFileList.filter(
            (filename) => filename.replace(path.extname(filename), '') === basenameOrSubtree,
        )
        if (!layerFilenames.length) {
            this.logger.debug(`Could not find layer ${basenameOrSubtree}, skipping.`)
            return {}
        }
        const layerTypes = layerFilenames.map((filename) => path.extname(filename).replace('.', ''))
        const loader = this.fileLoaders.find((loader) => layerTypes.includes(loader.name))
        if (!loader) {
            throw new Error(`Could not find loader for any of the ${layerFilenames}`)
        }
        const layerPath = path.join(
            this.configDirectory,
            String(layerFilenames.find((filename) => filename.endsWith(`.${loader.name}`))),
        )
        const layer = await loader(layerPath)
        this.logger.debug(`${layerPath} layer is loaded: `, layer)
        return layer
    }
}
