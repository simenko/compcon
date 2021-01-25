import path from 'path'
import { Config } from '../src'

const config = new Config()

describe('Config scenarios loading', () => {
    it('Should load config scenarios in order', async () => {
        await config.load(path.resolve(__dirname, 'testConfig'), ['base.ts', 'prod.ts'])
    })
})
