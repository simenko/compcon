import path from 'path'
import { Config } from '../src'

const config = Config.init()

describe.skip('Config layers loading', () => {
    it('Should load config layers in order', async () => {
        await config.create(['base', 'prod'], path.resolve(__dirname, 'testConfig'))
    })
})
