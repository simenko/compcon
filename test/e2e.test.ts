import path from 'path'
import { TypedConfig, UntypedConfig } from '../src'
import { ReadonlyAppConfig, validate, transform } from './testConfig/schema'

describe('Example typed configurations', () => {
    const originalEnv = JSON.stringify(process.env)
    const originalArgv = JSON.stringify(process.argv)

    afterEach(() => {
        process.env = JSON.parse(originalEnv)
        process.argv = JSON.parse(originalArgv)
    })
    const config = new TypedConfig<ReadonlyAppConfig>({ transform, validate })

    it('Simple dev config  ', async () => {
        process.env = {
            DB_PASSWORD: 'passwordFromEnv',
            NODE_ENV: 'development',
        }
        const configuration = (
            await config.create(['base', process.env.NODE_ENV ?? 'development'], path.resolve(__dirname, 'testConfig'))
        ).getClass()
        expect(configuration).toEqual({
            appName: 'test',
            db: {
                url: 'devDbUrl',
                user: 'devDbUser',
                password: 'passwordFromEnv',
            },
            vault: undefined,
        })
    })

    it('Simple prod config  ', async () => {
        process.env = {
            VAULT: '{"url":"vaultUrlFromEnv"}',
            NODE_ENV: 'production',
        }
        const configuration = (
            await config.create(['base', process.env.NODE_ENV ?? 'development'], path.resolve(__dirname, 'testConfig'))
        ).getClass()
        expect(configuration).toEqual({
            appName: 'test',
            db: {
                url: 'db.urlvaultUrlFromEnv',
                user: 'db.uservaultUrlFromEnv',
                password: 'db.passwordvaultUrlFromEnv',
            },
            vault: { url: 'vaultUrlFromEnv' },
        })
    })
})

describe('Example untyped configurations', () => {
    const originalEnv = JSON.stringify(process.env)
    const originalArgv = JSON.stringify(process.argv)

    afterEach(() => {
        process.env = JSON.parse(originalEnv)
        process.argv = JSON.parse(originalArgv)
    })
    const config = new UntypedConfig()
    it('Should allow untyped access by path', async () => {
        process.env = {
            VAULT: '{"url":"vaultUrlFromEnv"}',
            NODE_ENV: 'production',
        }
        const configuration = await config.create(
            ['base', process.env.NODE_ENV ?? 'development'],
            path.resolve(__dirname, 'testConfig'),
        )
        console.log(configuration.get())
    })
})
