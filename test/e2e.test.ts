import path from 'path'
import { env } from '../src/readers'
import { Config } from '../src'
import { vault } from './mockReaders'

const config = new Config([env, vault])

describe('Config scenarios loading', () => {
    it('Should load config scenarios in order', async () => {
        await config.load(path.resolve(__dirname, 'testConfig'), ['base.ts', 'prod.ts'])
    })
})
