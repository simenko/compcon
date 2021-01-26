const { composite, env } = require('../../src')

module.exports = {
    db: {},
    appName: 'test-js',
    nested: {
        path: composite(env('SOME_ENV_VAR'), 'defaultValue'),
    },
    vault: {
        url: env('VAULT_URL'),
    },
}
