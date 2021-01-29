import path from 'path'
import { Config } from '../src'

const config = new Config()

describe('Config layers loading', () => {
    it('Should load config layers in order', async () => {
        await config.load(['base', 'prod'], path.resolve(__dirname, 'testConfig'))
    })
})
