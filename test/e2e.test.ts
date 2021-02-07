import path from 'path'
import Config from '../src'
import { ReadonlyAppConfig, validate, transform } from './testConfig/schema'

const config = Config<ReadonlyAppConfig>(transform, { validate })
// const config = Config()

describe('Config layers loading', () => {
    it('Should load config layers in order', async () => {
        const configuration = (await config.create(['base', 'prod'], path.resolve(__dirname, 'testConfig'))).get()
        console.log(configuration.db)
    })
})
