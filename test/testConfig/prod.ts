import { get, env } from '../../src'
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
    // d2: get('dependent.onDb'),
    // d3: get('d2', (value) => String(value) + 'zzzzzzzzzzzzzz'),
    vault: env(),
}
