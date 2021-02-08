import { conventional, firstOf } from './composite'
import { iReader } from './common'
import { iConfigGetter } from '../Compiler'
import { ConfigurationError, ConfigurationErrorCodes } from '../../errors'

const mockGet: iConfigGetter = jest.fn(async (path: string) => path)

describe('Composite readers', () => {
    describe('firstOf reader', () => {
        it('Should apply readers one by one and return the first obtained value', async () => {
            const mockReader1: iReader = jest.fn(async () => 1)
            const mockReader2: iReader = jest.fn(async () => 2)
            const reader = firstOf([mockReader1, mockReader2])
            const value = await reader('a', console, mockGet)
            expect(mockReader1).toHaveBeenCalledWith('a', console, mockGet)
            expect(mockReader2).not.toHaveBeenCalled()
            expect(value).toEqual(1)
        })

        it('Should return literal value if given, and no reader have returned a value', async () => {
            const mockReader1: iReader = jest.fn(async () => undefined)
            const reader = firstOf([mockReader1, 'default'])
            const value = await reader('a', console, mockGet)
            expect(mockReader1).toHaveBeenCalledWith('a', console, mockGet)
            expect(value).toEqual('default')
        })

        it('Should log an error if a reader crashed, but keep going', async () => {
            const mockReader1: iReader = jest.fn(async () => {
                throw new Error('Test')
            })
            const mockReader2: iReader = jest.fn(async () => 2)
            const reader = firstOf([mockReader1, mockReader2])
            const logDebugSpy = jest.spyOn(console, 'debug')
            const value = await reader('a', console, mockGet)
            expect(mockReader1).toHaveBeenCalledWith('a', console, mockGet)
            expect(mockReader2).toHaveBeenCalledWith('a', console, mockGet)
            expect(value).toEqual(2)
            const error = logDebugSpy.mock.calls[0][0]
            expect(error).toBeInstanceOf(ConfigurationError)
            expect(error.code).toEqual(ConfigurationErrorCodes.READER_ERROR)
        })
    })

    describe('Conventional reader', () => {
        const originalEnv = JSON.stringify(process.env)
        const originalArgv = JSON.stringify(process.argv)

        afterEach(() => {
            process.env = JSON.parse(originalEnv)
            process.argv = JSON.parse(originalArgv)
        })

        it('Should check args first', async () => {
            process.argv.push('--a=testArg')
            const reader = conventional()
            const value = await reader('a', console, mockGet)
            expect(value).toEqual('testArg')
        })

        it('Should check env if a value could not be found in args', async () => {
            process.env.A = 'testEnv'
            const reader = conventional()
            const value = await reader('a', console, mockGet)
            expect(value).toEqual('testEnv')
        })

        it('Should return default value if args and env do not have it', async () => {
            const reader = conventional('testDefault')
            const value = await reader('a', console, mockGet)
            expect(value).toEqual('testDefault')
        })
    })
})
