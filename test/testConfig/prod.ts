import { iConfigReaderCreator, iReaderCreator } from '../../src/readers'
import { iVaultReaderCreator } from '../mockReaders'

export default function (readerCreators: { [key: string]: iReaderCreator }) {
    const get: iConfigReaderCreator = readerCreators.get
    const vault: iVaultReaderCreator = readerCreators.vault
    return {
        db: {
            url: vault('db.url'),
            user: vault('db.user'),
            password: vault('db.password'),
        },
        dependent: {
            onDb: get('db.url'),
        },
    }
}
