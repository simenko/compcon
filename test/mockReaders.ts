import { withTransformers, iValueTransformer } from '../src'
import { configLeaf, tree } from '../src/Config'

export const vault = (vaultPath: string, valueTransformer?: iValueTransformer<configLeaf | tree<configLeaf>>) => {
    return withTransformers(
        async function vault(path: string, logger, get) {
            const vaultUrl = await get('vault.url')
            if (!vaultUrl) {
                throw new Error('Could not connect to vault.')
            }

            logger.info(`Connected to ${vaultUrl} taken from ${vaultPath}`)
            return path + vaultUrl
        },
        () => vaultPath,
        valueTransformer,
    )
}
