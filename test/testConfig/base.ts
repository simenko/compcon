import { firstOf, env } from '../../src'

export default {
    db: {},
    appName: 'test',
    vault: {
        url: firstOf([env('VAULT_URL'), 'default']),
    },
}
