import { firstOf, env, get, arg } from '../../src'

export default {
    db: {
        url: firstOf([env('DB'), get('nested.path'), 'mysqldb']),
        user: 'defaultUser',
        password: arg(),
    },
}
