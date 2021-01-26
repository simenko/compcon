import { firstOf, env, get } from '../../src/readers'

export default {
    db: {
        url: firstOf(env('DB'), get('nested.path'), 'mysqldb'),
        user: env(),
        password: env(),
    },
}
