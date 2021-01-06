import { iEnvReaderCreator, iCompositeReaderCreator, iConfigReaderCreator, iReaderCreator } from '../../src/readers'

export default function (readerCreators: { [key: string]: iReaderCreator }) {
    const composite: iCompositeReaderCreator = readerCreators.composite
    const env: iEnvReaderCreator = readerCreators.env
    const get: iConfigReaderCreator = readerCreators.get
    return {
        db: {
            url: composite(env('DB'), get('nested.path'), 'mysqldb'),
            user: env(),
            password: env(),
        },
    }
}
