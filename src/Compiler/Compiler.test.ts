import { Compiler, iCompile } from './Compiler'
import { iConfigLogger } from '../Config'
import { json } from './valueTransformers'
import { get, iReader, withTransformers } from './readers'
import { Codes, ConfigurationError } from '../ConfigurationError'

const mockLogger: iConfigLogger = {
    info: jest.fn(),
    debug: jest.fn(),
}

const mockReader: jest.Mock = jest.fn(withTransformers(async () => 'mockValue'))
const mockDefaultReaderCreator: jest.Mock = jest.fn((v) => withTransformers(async () => v))
const mockValueTransformer = jest.fn((v) => v)
const primitiveScenario = {
    a: {
        b: mockReader,
        c: 1,
    },
}

describe('Compiler', () => {
    let compile: iCompile
    beforeEach(() => {
        jest.clearAllMocks()
        compile = Compiler(mockLogger, mockDefaultReaderCreator, [mockValueTransformer])
    })

    it('Should call the given reader and pass the logger and default transformers to it', async () => {
        await compile(primitiveScenario)
        expect(mockReader).toHaveBeenCalledWith('a.b', mockLogger, expect.any(Function), [mockValueTransformer])
    })

    it('Should call the conventional reader for non-functional values', async () => {
        await compile(primitiveScenario)
        expect(mockDefaultReaderCreator).toHaveBeenCalledWith(1)
    })

    it('Should pass proper config value getter to readers', async () => {
        await compile(primitiveScenario)
        const get = mockReader.mock.calls[0][2]
        await expect(get('a.c')).resolves.toEqual(1)
    })

    it('Should compile complex nested configs with long chains of dependencies', async () => {
        const complexScenario = {
            one1: {
                two1: {
                    three1: 'one1.two1.three1.value',
                    three2: 42,
                    three3: false,
                },
            },
            one2: get('one1.two1.three2'),
            one3: get('one2'),
            one4: get('one3'),
            one5: get('one4'),
            one6: get('one5'),
            one7: get('one6'),
            one8: get('one7'),
        }
        const config = await compile(complexScenario)
        expect(config).toEqual({
            one1: {
                two1: {
                    three1: 'one1.two1.three1.value',
                    three2: 42,
                    three3: false,
                },
            },
            one2: 42,
            one3: 42,
            one4: 42,
            one5: 42,
            one6: 42,
            one7: 42,
            one8: 42,
        })
    })

    it('Should treat stringified JSON values as parts of the config tree', async () => {
        const scenarioWithJSON = {
            a: '{"b":{"c":{"d":42}}}',
            x: get('a.b.c.d'),
        }
        const compile = Compiler(mockLogger, mockDefaultReaderCreator, [json])
        const config = await compile(scenarioWithJSON)
        expect(config).toEqual({ a: { b: { c: { d: 42 } } }, x: 42 })
    })

    it('Should throw meaningful error if some reader throws', async () => {
        class ReaderError extends Error {}
        const badReader = () => {
            throw new ReaderError()
        }
        const badScenario = {
            a: badReader,
        }
        try {
            await compile(badScenario)
        } catch (e) {
            expect(e).toBeInstanceOf(ConfigurationError)
            expect(e).toHaveProperty('code', Codes.COMPILATION_ERROR)
            expect(e).toHaveProperty('details', { path: 'a', reader: 'badReader' })
            expect(e).toHaveProperty('reason', expect.any(ReaderError))
        }
    })

    describe('Timeouts', () => {
        beforeEach(() => {
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it('Should throw meaningful error if a path could not be resolved due to reader timeout', async () => {
            const hungReader: iReader = () => new Promise(() => {})
            const timeoutScenario = {
                a: hungReader,
            }
            try {
                const compilation = compile(timeoutScenario)
                jest.runAllTimers()
                await compilation
            } catch (e) {
                expect(e).toBeInstanceOf(ConfigurationError)
                expect(e).toHaveProperty('code', Codes.COMPILATION_ERROR)
                expect(e).toHaveProperty('details', { unresolvedPaths: ['a'] })
            }
        })

        it('Should throw meaningful error if a path could not be resolved due to bad get() parameter', async () => {
            const timeoutScenario = {
                a: get('bad.path'),
            }
            try {
                const compilation = compile(timeoutScenario)
                jest.runAllTimers()
                await compilation
            } catch (e) {
                expect(e).toBeInstanceOf(ConfigurationError)
                expect(e).toHaveProperty('code', Codes.COMPILATION_ERROR)
                expect(e).toHaveProperty('details', { unresolvedPaths: ['a'], missingPaths: ['bad.path'] })
            }
        })
    })
})
