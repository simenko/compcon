import path from 'path'
import 'reflect-metadata'
import Config from '../src'
import { ReadonlyAppConfig, transformer } from './testConfig/schema'

const config = Config<ReadonlyAppConfig>(transformer)
// const config = Config()

describe('Config layers loading', () => {
    it('Should load config layers in order', async () => {
        await config.build(['base', 'prod'], path.resolve(__dirname, 'testConfig'))
        const configuration = config.get()
        // configuration.db = '111'
        console.log(configuration.db)
    })
})
