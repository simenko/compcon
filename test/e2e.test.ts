import path from 'path'
import Config from '../src'
import { ReadonlyAppConfig, validate, transform } from './testConfig/schema'

// With type safety
const config = Config<ReadonlyAppConfig>({ transform, validate })

// Without type safety
// const config = Config()

describe('Config layers loading', () => {
    it('Should load config layers in order', async () => {
        const configuration = (await config.create(['base', 'prod'], path.resolve(__dirname, 'testConfig'))).getClass()
        console.log(configuration.db)
    })
})
