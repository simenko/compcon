import { conventional, firstOf } from './composite'
import { iReader } from './common'
import { iConfigGetter } from '../Compiler'
import { Codes, ConfigurationError } from '../../ConfigurationError'

const mockGet: iConfigGetter = jest.fn(async (path: string) => path)

describe('Composite readers', () => {
    describe('firstOf reader', () => {
        it('Should apply readers one by one and return the first obtained value', async () => {
            const mockReader1: jest.MockedFunction<iReader> = jest.fn(async (_1, _2, _3) => 1)
            const mockReader2: jest.MockedFunction<iReader> = jest.fn(async (_1, _2, _3) => 2)
            const reader = firstOf([mockReader1, mockReader2])
            const value = await reader('a', console, mockGet)
            expect(mockReader1).toHaveBeenCalledWith('a', console, mockGet)
            expect(mockReader2).not.toHaveBeenCalled()
            expect(value).toEqual(1)
        })

        it('Should return literal value if given, and no reader have returned a value', async () => {
            const mockReader1: jest.MockedFunction<iReader> = jest.fn(async (_1, _2, _3) => null)
            const reader = firstOf([mockReader1, 'default'])
            const value = await reader('a', console, mockGet)
            expect(mockReader1).toHaveBeenCalledWith('a', console, mockGet)
            expect(value).toEqual('default')
        })

        it('Should log an error if a reader crashed, but keep going', async () => {
            const mockReader1: jest.MockedFunction<iReader> = jest.fn(async (_1, _2, _3) => {
                throw new Error('Test')
            })
            Object.defineProperty(mockReader1, 'name', { value: 'mockReader1' })
            const mockReader2: jest.MockedFunction<iReader> = jest.fn(async (_1, _2, _3) => 2)
            const reader = firstOf([mockReader1, mockReader2])
            const logDebugSpy = jest.spyOn(console, 'debug')
            const value = await reader('a', console, mockGet)
            expect(mockReader1).toHaveBeenCalledWith('a', console, mockGet)
            expect(mockReader2).toHaveBeenCalledWith('a', console, mockGet)
            expect(value).toEqual(2)
            const error = logDebugSpy.mock.calls[0][0]
            expect(error).toBeInstanceOf(ConfigurationError)
            expect(error.code).toEqual(Codes.READER_ERROR)
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
            process.argv = ['', '', '--a=testArg']
            const reader = conventional('default')
            const value = await reader('a', console, mockGet)
            expect(value).toEqual('testArg')
        })

        it('Should check env if a value could not be found in args', async () => {
            process.env = { A: 'testEnv' }
            const reader = conventional('default')
            const value = await reader('a', console, mockGet)
            expect(value).toEqual('testEnv')
        })

        it('Should return default value if args and env do not have it', async () => {
            const reader = conventional('default')
            const value = await reader('a', console, mockGet)
            expect(value).toEqual('default')
        })
    })
})
