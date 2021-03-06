import { env } from '../../src'
import { vault } from '../mockReaders'

export default {
    db: {
        url: vault('db.url'),
        user: vault('db.user'),
        password: vault('db.password'),
    },
    vault: env(),
}
