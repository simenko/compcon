import { composite, env } from '../../src/readers'

export default {
    db: {},
    appName: 'test',
    nested: {
        path: composite(env('SOME_ENV_VAR'), 'defaultValue'),
    },
    vault: {
        url: env('VAULT_URL'),
    },
}
