import { readdir } from 'fs'
import Loader from './Loader'
import { ConfigurationError, ErrorCodes } from './errors'
import * as utils from './utils'

jest.mock('fs')
// https://github.com/microsoft/TypeScript/issues/26591
// @ts-ignore
;(readdir as jest.MockedFunction<typeof readdir>).mockImplementation((name, cb) => cb(null, []))
const mergeSpy = jest.spyOn(utils, 'merge')

describe('Loader class', () => {
    let load
    beforeEach(() => {
        load = Loader(console, [])
        jest.clearAllMocks()
    })
    describe('work with filesystem', () => {
        it('Should not touch filesystem if no config directory specified', async () => {
            await load([{ foo: 1 }])
            expect(readdir).not.toHaveBeenCalled()
        })

        it('Should scan configuration directory for files', async () => {
            await load([{ foo: 1 }], 'foo')
            expect(readdir).toHaveBeenCalledWith('foo', expect.any(Function))
        })

        it('Should try file loaders in the order they appear in the Loader param', async () => {
            const ts = jest.fn(async () => ({}))
            Object.defineProperty(ts, 'name', { value: 'ts' })
            const js = jest.fn(async () => ({}))
            Object.defineProperty(js, 'name', { value: 'js' })
            ;(readdir as jest.MockedFunction<typeof readdir>).mockImplementation((name, cb) =>
                // @ts-ignore
                cb(null, ['config.ts', 'config.js']),
            )
            const load = Loader(console, [ts, js])
            await load(['config'], 'foo')
            expect(ts).toHaveBeenCalledTimes(1)
            expect(js).not.toHaveBeenCalled()
        })

        it('Should throw ConfigurationError when things go wrong', async () => {
            const load = Loader(console, [])
            // @ts-ignore
            ;(readdir as jest.MockedFunction<typeof readdir>).mockImplementationOnce((name, cb) => cb(new Error()))
            await expect(load([{ foo: 1 }], 'foo')).rejects.toThrow(ConfigurationError)
        })

        it('Should throw ConfigurationError when there is no suitable file loader for any config file with layer basename', async () => {
            const js = jest.fn(async () => ({}))
            Object.defineProperty(js, 'name', { value: 'js' })
            ;(readdir as jest.MockedFunction<typeof readdir>).mockImplementation((name, cb) =>
                // @ts-ignore
                cb(null, ['config.json']),
            )
            const load = Loader(console, [js])
            await expect(load(['config'], 'foo')).rejects.toThrow(ConfigurationError)
        })

        it('Should log error if there are no files matching layer name found, but keep loading', async () => {
            const debugSpy = jest.spyOn(console, 'debug')
            const js = jest.fn(async () => ({}))
            Object.defineProperty(js, 'name', { value: 'js' })
            ;(readdir as jest.MockedFunction<typeof readdir>).mockImplementation((name, cb) =>
                // @ts-ignore
                cb(null, ['config.js']),
            )
            const load = Loader(console, [js])
            await load(['config', 'extra-layer'], 'foo')
            const error = debugSpy.mock.calls[0][0]
            expect(error).toBeInstanceOf(ConfigurationError)
            expect(error).toHaveProperty('code', ErrorCodes.LOADING_ERROR)
            expect(error).toHaveProperty('details', { layerName: 'extra-layer' })
        })
    })

    describe('Scenario merging', () => {
        it('Should merge config layers in the order they appear in layers array', async () => {
            const scenario = await load([{ foo: 1 }, { foo: 2 }])
            expect(mergeSpy).toHaveBeenCalledWith({ foo: 1 }, { foo: 2 })
            expect(scenario).toEqual({ foo: 2 })
        })
    })
})
