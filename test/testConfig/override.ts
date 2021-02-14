import { vault } from '../mockReaders'
import { get } from '../../src'

export default {
    db: {
        url: vault('db.url'),
        user: 'root',
        password: '',
    },
    vault: '{"url":"overrideVaultUrl"}',
    we: {
        need: {
            to: {
                go: {
                    deeper: get('db.url', (v) => v + '_override'),
                },
            },
        },
    },
}
