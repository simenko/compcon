// @ts-ignore
import VaultClient from 'node-vault-client'
import { withTransformers } from './common'
import { iValueTransformer } from '../valueTransformers'

export const vault = (vaultPath: string, vaultConfigPath = '', valueTransformer?: iValueTransformer<unknown>) => {
    return withTransformers(
        async function vault(path: string, logger, get) {
            const vaultConnectionOptions = await get(vaultConfigPath)
            const lease = await VaultClient.boot('main', vaultConnectionOptions).read(vaultPath)
            return lease.getData()
        },
        undefined,
        valueTransformer,
    )
}
