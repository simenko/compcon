import { firstOf, env } from '../../src'

export default {
    db: {
        url: firstOf([env('DB_URL'), 'devDbUrl']),
        user: 'devDbUser',
        password: env(),
    },
}
