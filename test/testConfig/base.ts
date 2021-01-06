import { iEnvReaderCreator, iCompositeReaderCreator, iReaderCreator } from '../../src/readers'

export default function (readerCreators: { [key: string]: iReaderCreator }) {
    const composite: iCompositeReaderCreator = readerCreators.composite
    const env: iEnvReaderCreator = readerCreators.env
    return {
        db: {},
        appName: 'test',
        nested: {
            path: composite(env('SOME_ENV_VAR'), 'defaultValue'),
        },
        vault: {
            url: env('VAULT_URL'),
        },
    }
}
