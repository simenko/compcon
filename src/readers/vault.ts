// @ts-ignore
import VaultClient from 'node-vault-client'
import { withTransformers } from './common'
import { iTransformer } from '../transformers'

export const vault = (vaultPath: string, vaultConfigPath: string, customTransformer?: iTransformer) => {
    return withTransformers(async function vault(path: string, logger, get) {
        const vaultConnectionOptions = await get(vaultConfigPath)
        const lease = await VaultClient.boot('main', vaultConnectionOptions).read(vaultPath)
        return lease.getData()
    }, customTransformer)
}
