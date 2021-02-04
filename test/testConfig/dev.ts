import { firstOf, env, get } from '../../src'

export default {
    db: {
        url: firstOf([env('DB'), get('nested.path'), 'mysqldb']),
        user: 'defaultUser',
        password: env(),
    },
}
