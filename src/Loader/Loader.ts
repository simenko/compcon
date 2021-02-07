import path from 'path'
import { readdir } from 'fs'
import { promisify } from 'util'
import { merge } from '../utils'
import { iFileLoader } from './fileLoaders'
import { iConfigLogger, POJO } from '../BaseConfig'
import { ConfigurationError, ErrorCodes } from '../errors'

export interface iLoad {
    (layers: (string | POJO)[], configDirectory: string): Promise<POJO>
}

export default function Loader(logger: iConfigLogger, fileLoaders: iFileLoader[]) {
    return async function load(layers: (string | POJO)[], configDirectory: string): Promise<POJO> {
        let configDirFileList: string[]
        try {
            if (configDirectory) {
                configDirFileList = await promisify(readdir)(configDirectory)
            }
            const loadedLayers = await Promise.all(
                layers.map(async (basenameOrSubtree) => loadLayer(basenameOrSubtree)),
            )

            const scenario = merge(...loadedLayers)
            logger.debug(`Config scenario loaded: `, scenario)
            return scenario
        } catch (e) {
            throw new ConfigurationError(ErrorCodes.LOADING_ERROR, 'Could not load configuration', e)
        }

        async function loadLayer(basenameOrSubtree: string | POJO) {
            if (typeof basenameOrSubtree === 'object') {
                return basenameOrSubtree
            }
            const layerFilenames = configDirFileList.filter(
                (filename) => filename.replace(path.extname(filename), '') === basenameOrSubtree,
            )
            if (!layerFilenames.length) {
                logger.debug(
                    new ConfigurationError(ErrorCodes.LOADING_ERROR, `Could not find a layer, skipping.`, {
                        layerName: basenameOrSubtree,
                    }),
                )
                return {}
            }
            const layerTypes = layerFilenames.map((filename) => path.extname(filename).replace('.', ''))
            const loader = fileLoaders.find((loader) => layerTypes.includes(loader.name))
            if (!loader) {
                throw new ConfigurationError(
                    ErrorCodes.LOADING_ERROR,
                    `Could not find loader for any of the ${layerFilenames}.`,
                    { layerFilenames },
                )
            }
            const layerPath = path.join(
                configDirectory,
                String(layerFilenames.find((filename) => filename.endsWith(`.${loader.name}`))),
            )
            const layer = await loader(layerPath)
            logger.debug(`${layerPath} layer is loaded: `, layer)
            return layer
        }
    }
}
