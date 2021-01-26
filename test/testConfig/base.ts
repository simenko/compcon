import { firstOf, env } from '../../src/readers'

export default {
    db: {},
    appName: 'test',
    nested: {
        path: firstOf(env('SOME_ENV_VAR'), 'defaultValue'),
    },
    vault: {
        url: env('VAULT_URL'),
    },
}
