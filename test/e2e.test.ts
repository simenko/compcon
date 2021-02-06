import path from 'path'
import 'reflect-metadata'
import Config from '../src'
import { ReadonlyAppConfig, transform } from './testConfig/schema'

const config = Config<ReadonlyAppConfig>(transform)
// const config = Config()

describe('Config layers loading', () => {
    it('Should load config layers in order', async () => {
        await config.create(['base', 'prod'], path.resolve(__dirname, 'testConfig'))
        const configuration = config.get()
        // configuration.db = '111'
        console.log(configuration.db)
    })
})
