import { readdir } from 'fs'
import Loader from './Loader'
import { ConfigurationError } from './errors'
import * as utils from './utils'

jest.mock('fs')
// https://github.com/microsoft/TypeScript/issues/26591
// @ts-ignore
;(readdir as jest.MockedFunction<typeof readdir>).mockImplementation((name, cb) => cb(null, []))
const mergeSpy = jest.spyOn(utils, 'merge')

describe('Loader class', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })
    describe('work with filesystem', () => {
        it('Should not touch filesystem if no config directory specified', async () => {
            const load = Loader(console, [])
            await load([{ foo: 1 }])
            expect(readdir).not.toHaveBeenCalled()
        })

        it('Should scan configuration directory for files', async () => {
            const load = Loader(console, [])
            await load([{ foo: 1 }], 'foo')
            expect(readdir).toHaveBeenCalledWith('foo', expect.any(Function))
        })

        it('Should throw ConfigurationError when things go wrong', async () => {
            const load = Loader(console, [])
            // @ts-ignore
            ;(readdir as jest.MockedFunction<typeof readdir>).mockImplementationOnce((name, cb) => cb(new Error()))
            await expect(load([{ foo: 1 }], 'foo')).rejects.toThrow(ConfigurationError)
        })
    })

    describe('Scenario merging', () => {
        it('Should merge config layers in the order they appear in layers array', async () => {
            const load = Loader(console, [])
            const scenario = await load([{ foo: 1 }, { foo: 2 }])
            console.log(mergeSpy.mock.calls)
            expect(mergeSpy).toHaveBeenCalledWith({ foo: 1 }, { foo: 2 })
            expect(scenario).toEqual({ foo: 2 })
        })

        it('Should build new scenario from scratch when amend param = false', async () => {
            const load = Loader(console, [])
            await load([{ foo: 1 }])
            const scenario = await load([{ bar: 1 }])
            expect(scenario).toEqual({ bar: 1 })
        })
    })
})
