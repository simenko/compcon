import { iReader, iWrappedReader } from '../src/readers'

export interface iVaultReaderCreator {
    (vaultPath?: string): iWrappedReader
}

export const vault: iReader = async function (path: string, logger, get) {
    const vaultUrl = await get('vault.url')
    if (!vaultUrl) {
        throw new Error('Could not connect to vault.')
    }

    logger.info('Connected to ' + vaultUrl)
    return path
}
