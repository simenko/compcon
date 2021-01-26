import { firstOf, env, get, conventional, arg } from '../../src'

export default {
    db: {
        url: firstOf(env('DB'), get('nested.path'), 'mysqldb'),
        user: conventional('defaultUser'),
        password: arg(),
    },
}
