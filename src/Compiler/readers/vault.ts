// @ts-ignore
import VaultClient from 'node-vault-client'
import { withTransformers } from './common'
import { iValueTransformer } from '../valueTransformers'
import { configValue } from '../../Config'

export const vault = (vaultPath: string, vaultConfigPath = '', valueTransformer?: iValueTransformer<configValue>) => {
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
