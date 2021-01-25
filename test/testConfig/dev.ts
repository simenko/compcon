import { composite, env, get } from '../../src/readers'

export default {
    db: {
        url: composite(env('DB'), get('nested.path'), 'mysqldb'),
        user: env(),
        password: env(),
    },
}
