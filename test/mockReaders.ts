import { iReader } from '../src/readers'

export const vault = (vaultPath: string): iReader =>
    async function vault(path: string, logger, get) {
        const vaultUrl = await get('vault.url')
        if (!vaultUrl) {
            throw new Error('Could not connect to vault.')
        }

        logger.info(`Connected to ${vaultUrl} taken from ${vaultPath}`)
        return path + vaultUrl
    }
