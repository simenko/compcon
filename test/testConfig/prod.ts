import { get } from '../../src/readers'
import { vault } from '../mockReaders'

export default {
    db: {
        url: vault('db.url'),
        user: vault('db.user'),
        password: vault('db.password'),
    },
    dependent: {
        onDb: get('db.url'),
    },
}
