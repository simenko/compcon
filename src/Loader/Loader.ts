import path from 'path'
import { readdir } from 'fs'
import { promisify } from 'util'
import { merge } from '../utils'
import { iFileLoader } from './fileLoaders'
import { iConfigLogger, scenario } from '../Config'
import { ConfigurationError, Codes } from '../ConfigurationError'

export interface iLoad {
    (layers: (string | scenario)[], configDirectory: string): Promise<scenario>
}

export function Loader(logger: iConfigLogger, fileLoaders: iFileLoader[]) {
    return async function load(layers: (string | scenario)[], configDirectory: string): Promise<scenario> {
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
            throw new ConfigurationError(Codes.LOADING_ERROR, e, 'Could not load configuration')
        }

        async function loadLayer(basenameOrSubtree: string | scenario) {
            if (typeof basenameOrSubtree === 'object') {
                return basenameOrSubtree
            }
            const layerFilenames = configDirFileList.filter(
                (filename) => filename.replace(path.extname(filename), '') === basenameOrSubtree,
            )
            if (!layerFilenames.length) {
                logger.debug(
                    new ConfigurationError(
                        Codes.LOADING_ERROR,
                        {
                            layerName: basenameOrSubtree,
                        },
                        `Could not find layer ${basenameOrSubtree}, skipping.`,
                    ),
                )
                return {}
            }
            const layerTypes = layerFilenames.map((filename) => path.extname(filename).replace('.', ''))
            const loader = fileLoaders.find((loader) => layerTypes.includes(loader.name))
            if (!loader) {
                throw new ConfigurationError(
                    Codes.LOADING_ERROR,
                    { layerFilenames },
                    `Could not find loader for ${layerFilenames}.`,
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
